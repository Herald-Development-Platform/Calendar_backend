const departmentModel = require("./department.model");
const eventModel = require("./event.model");
const userModel = require("./user.model");
const departmentRequestModel = require("./departmentRequest.model");
const notificationModel = require("./notification.model");
const locationModel = require("./location.model");
const blockModel = require("./block.model");
const syncedEventModel = require("./syncedEvents.schema");
const semesterModel = require("./semester.model");
const columnModel = require("./taskmanagement/column.model");
const labelModel = require("./taskmanagement/label.model");
const taskModel = require("./taskmanagement/task.model");
const commentModel = require("./taskmanagement/comment.model");

module.exports = {
  departmentModel,
  eventModel,
  userModel,
  departmentRequestModel,
  notificationModel,
  locationModel,
  blockModel,
  syncedEventModel,
  semesterModel,
  columnModel,
  labelModel,
  taskModel,
  commentModel,
};
