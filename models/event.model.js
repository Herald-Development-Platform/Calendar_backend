const mongoose = require('mongoose');
const BaseMongooseSchema = require('./base.schema');
const { RECURRING_TYPES } = require('../constants/event.constants');

const eventSchema = new BaseMongooseSchema({
    title: { type: String, required: true },
    description: { type: String, required: true, },
    start: { type: Date, required: true, },
    end: { type: Date, required: true, },
    location: { type: String },
    recurringType: { type: String, enum: Object.values(RECURRING_TYPES), default: RECURRING_TYPES.NONE },
    recurrenceEnd: { type: Date, default: () => Date.now() + (86400000 * 365) },
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
    color: {
        type: String,
        default: '#399AC0',
    },
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
    },
    exceptionRanges: [
        {
            start: { type: Date },
            end: { type: Date },
        }
    ],
    notifiedDates: [Date],
    personal: {
        type: Boolean,
        default: false,
    },
});


const EventModel = mongoose.model('Events', eventSchema);
module.exports = EventModel;