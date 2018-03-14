// import mongoose module
const mongoose = require('mongoose');

// set up mongoose to use Promise
mongoose.Promise = global.Promise;

// connect mongoose to the mongo db
mongoose.connect(process.env.MONGODB_URI);

// exports
module.exports = {
    mongoose
};
