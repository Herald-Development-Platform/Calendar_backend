const mongoose = require('mongoose');
const BaseMongooseSchema = require('./base.schema');
const { sendNotification } = require('../controllers/websocket/socket.controller');

const notificationSchema = new BaseMongooseSchema({
    context: {
        type: String,
        required: true,
    },
    contextId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    message: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now
    }
});

notificationSchema.post("save", async function () {
    sendNotification(this.toObject());
});

const NotificationModel = mongoose.model('Notification', notificationSchema);
module.exports = NotificationModel;
