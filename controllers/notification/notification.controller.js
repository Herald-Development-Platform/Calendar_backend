const { StatusCodes } = require("http-status-codes");
const notificationModel = require("../../models/notification.model");
async function getNotifications(req, res, next) {
  try {
    const { readStatus, fromDaysAgo, toDaysAgo } = req.query;

    const filter = {};
    if (readStatus) {
      filter.isRead = readStatus;
    }
    if (fromDaysAgo) {
      filter.date = {
        $gte: new Date(new Date().setDate(new Date().getDate() - fromDaysAgo)),
      };
    }
    if (toDaysAgo && toDaysAgo !== 0) {
      filter.date = {
        $lte: new Date(new Date().setDate(new Date().getDate() - toDaysAgo)),
      };
    }

    const notifications = await notificationModel
      .find({
        ...filter,
        user: req.user._id,
      })
      .populate("contextId")
      .sort({ date: -1 });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

const createNotification = async ({ user, contextId, context, message }) => {
  const notification = await new notificationModel({
    user,
    contextId,
    context,
    message,
  }).save();
  // const notification = new notificationModel({
  //   user,
  //   contextId,
  //   context,
  //   message,
  // });;
  return notification;
};

const markAsRead = async (req, res, next) => {
  try {
    const { id: notificationId } = req.params;
    let notification;
    if (notificationId) {
      notification = await notificationModel.findOneAndUpdate(
        {
          _id: notificationId,
          user: req.user._id,
        },
        {
          isRead: true,
        },
        {
          new: true,
        }
      );
    } else {
      notification = await notificationModel.updateMany(
        {
          user: req.user._id,
        },
        {
          isRead: true,
        },
        {
          new: true,
          multi: true,
        }
      );
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Marked as read",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
};
