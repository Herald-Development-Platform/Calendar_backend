const mongoose = require('mongoose');
const BaseMongooseSchema = require('./base.schema');

const eventSchema = new BaseMongooseSchema({
    title: { type: String, required: true },
    description: { type: String, required: true, },
    start: { type: Date, required: true, },
    end: { type: Date, required: true, },
    location: { type: String, required: true, },
    recurring: { type: Boolean, default: false },
    recurringTime: { type: Date },
    departments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Departments',
            required: true,
        }
    ],
    involvedUsers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
        }
    ],
    color: String,
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
    },
});

const EventModel = mongoose.model('Events', eventSchema);
module.exports = EventModel;