const mongoose = require('mongoose');
const Campground = require('../models/campground');
const { descriptors, places } = require('./seedHelper');
const cities = require('./cities');

mongoose.connect('mongodb://localhost:27017/yelp-camp', { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'DB connection error:'));
db.once('open', () => {
    console.log('DB CONNECTED!!');
});

const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    const campgrounds = [];
    for (let i = 0; i < 200; i++) {
        const location = cities[Math.floor(Math.random() * 1000)];
        const price = Math.floor(Math.random() * 20) + 10;
        campgrounds.push({
            author: '60b749aad37d022e0c3c23ef',
            title: `${getRandomItem(descriptors)} ${getRandomItem(places)}`,
            location: `${location.city}, ${location.state}`,
            description: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Earum molestias iusto ad assumenda corrupti quo tempore dolore rem dignissimos laboriosam quas voluptatem explicabo non quos quod, ab inventore, obcaecati accusamus?',
            price: price,
            geometry: {
                coordinates:[location.longitude,location.latitude],
                type:'Point'
            },
            images: []
        })
    }
    await Campground.insertMany(campgrounds);
}

seedDB().then(() => {
    mongoose.connection.close();
})