const Campground = require('../models/campground');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapboxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapboxToken });
const { cloudinary } = require('../cloudinary');
const ExpressError = require('../utils/ExpressError');

module.exports.index = async (req, res, next) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.showCampground = async (req, res, next) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: 'author'
    }).populate('author');
    if (!campground) {
        req.flash('error', 'Campground does not exists!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
}

module.exports.renderEditForm = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);    
    if (!campground) {
        req.flash('error', 'Campground does not exists!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
}

module.exports.createCampground = async (req, res, next) => {
    const geodata = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()

    if (!geodata.body.features.length) {
        return next(new ExpressError('Cannot find the location.', 400));
    } 
    const campground = new Campground(req.body.campground);
    campground.geometry = geodata.body.features[0].geometry;
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.author = req.user._id;
    await campground.save();
    req.flash('success', 'Campground successfully created.');
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.updateCampground = async (req, res, next) => {
    const geodata = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()

    if (!geodata.body.features.length) {
        return next(new ExpressError('Cannot find the location.', 400));
    } 
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.geometry = geodata.body.features[0].geometry;
    campground.images.push(...images);
    await campground.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
    }
    req.flash('success', 'Campground successfully updated.');
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteCampground = async (req, res, next) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Campground successfully deleted.');
    res.redirect('/campgrounds');
}