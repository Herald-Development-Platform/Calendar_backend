const eventRouter = require("express").Router();
const {
    checkPermissions
} = require("../middlewares/permission.middleware");

const {
    PERMISSIONS
} = require("../constants/permissions.constants");

const {
    createEvent,
    getEvents,
    deleteEvent,
} = require("../controllers/event/event.controller");

const { verifyToken } = require("../middlewares/auth.middleware");


eventRouter.post(
    "/event",
    verifyToken,
    checkPermissions([PERMISSIONS.CREATE_EVENT]),
    createEvent
);
eventRouter.get(
    "/event",
    verifyToken,
    getEvents
);
eventRouter.delete(
    "/event/:id",
    verifyToken,
    checkPermissions([PERMISSIONS.DELETE_EVENT]),
    deleteEvent
);


module.exports = eventRouter;