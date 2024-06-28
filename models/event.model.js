const mongoose = require('mongoose');
const BaseMongooseSchema = require('./base.schema');
const { RECURRING_TYPES } = require('../constants/event.constants');
const userModel = require("./user.model");
const { sendEmail } = require('../services/email.services');
const { getNewEventNotificationEmailContent } = require('../emails/notification.html');
const { createNotification } = require('../controllers/notification/notification.controller');
const { NOTIFICATION_CONTEXT } = require('../constants/notification.constants');

const eventSchema = new BaseMongooseSchema({
    title: { type: String, required: true },
    description: { type: String, required: true, },
    start: { type: Date, required: true, },
    end: { type: Date, required: true, },
    location: { type: String, required: true, },
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
    googleId: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
    },
});

eventSchema.pre("save", async function (next) {
    let departmentUsers = [];
    await Promise.all(this.departments.map(async department => {
        const currentDepartmentUsers = await userModel.find({ department });
        departmentUsers = departmentUsers.concat(currentDepartmentUsers);
    }));

    await Promise.all(this.involvedUsers.map(async userID => {
        const user = await userModel.findById(userID);
        if (!user) {
            throw new Error('User not found');
        }
        departmentUsers.push(user);
    }));
    departmentUsers = Array.from(new Set(departmentUsers));
    departmentUsers = departmentUsers.map(user => {
        const emailContent = getNewEventNotificationEmailContent(user.username, this);
        const notification = createNotification({
            user: user._id,
            contextId: this._id,
            context: NOTIFICATION_CONTEXT.NEW_EVENT,
            message: `New Event Created: ${this.title}`,
        });
        sendEmail(user.email, [], [], "New Event Created", emailContent);
    });
    console.log("Department Users in Hook: \n", departmentUsers);
    next();
});

const EventModel = mongoose.model('Events', eventSchema);
module.exports = EventModel;