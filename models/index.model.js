const departmentModel = require('./department.model');
const eventModel = require("./event.model");
const userModel = require("./user.model");
const departmentRequestModel = require("./departmentRequest.model");
const notificationModel = require("./notification.model");
const locationModel = require("./location.model");
const blockModel = require("./block.model");
const syncedEventModel = require("./syncedEvents.schema");
const semesterModel = require("./semester.model");

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
}