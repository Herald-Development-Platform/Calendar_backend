const mongoose = require('mongoose');
const BaseMongooseSchema = require('./base.schema');
const { RECURRING_TYPES } = require('../constants/event.constants');
const userModel = require("./user.model");
const { sendEmail } = require('../services/email.services');
const { getNewEventNotificationEmailContent } = require('../emails/notification.html');
const { createNotification } = require('../controllers/notification/notification.controller');
const { NOTIFICATION_CONTEXT } = require('../constants/notification.constants');
const { google } = require('googleapis');

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
    color: String,
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
    },
});


const EventModel = mongoose.model('Events', eventSchema);
module.exports = EventModel;