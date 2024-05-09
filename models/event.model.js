const mongoose = require('mongoose');
const BaseMongooseSchema = require('./base.schema');
const {
    DEPARTMENTS,
} = require('../constants/departments.constants');
const eventSchema = new BaseMongooseSchema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    start: {
        type: Date,
        required: true,
    },
    end: {
        type: Date,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        enum: Object.values(DEPARTMENTS),
        required: true,
    },
    color: String,
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
});

const EventModel = mongoose.model('Events', eventSchema);
module.exports = EventModel;