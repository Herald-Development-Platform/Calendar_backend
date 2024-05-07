const mongoose = require('mongoose');
const BaseMongooseSchema = require('./base.schema');

const eventSchema = new BaseMongooseSchema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    image: String,
    location: {
        type: String,
        required: true,
    },
    attending: {
        type: Number,
        default: 0,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
});

const EventModel = mongoose.model('Events', eventSchema);
module.exports = EventModel;