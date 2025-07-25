const mongoose = require("mongoose");
const BaseMongooseSchema = require("./base.schema");
const { sendNotification } = require("../controllers/websocket/socket.controller");
const { userModel } = require("./index.model");
const { DONOT_DISTURB_STATE } = require("../constants/notification.constants");

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
    ref: "Users",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.post("save", async function () {
  const notificationUser = await userModel.findById(this.user);
  if (
    notificationUser.donotDisturbState !== DONOT_DISTURB_STATE.DEFAULT &&
    new Date(notificationUser.notificationExpiry).getTime() > Date.now()
  ) {
    return;
  }
  sendNotification(this.toObject());
});

const NotificationModel = mongoose.model("Notification", notificationSchema);
module.exports = NotificationModel;
