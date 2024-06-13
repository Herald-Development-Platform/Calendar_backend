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

const {
    convertEventsToIcs,
    convertIcsToEvents
} = require("../controllers/ics/ics.controller");

const { verifyToken } = require("../middlewares/auth.middleware");


eventRouter.post(
    "/event/exportIcs",
    verifyToken,
    convertEventsToIcs
);
eventRouter.post(
    "/event/fromIcs",
    verifyToken,
    convertIcsToEvents
);
eventRouter.post(
    "/event",
    verifyToken,
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
    deleteEvent
);
eventRouter.delete(
    "/event/:id",
    verifyToken,
    deleteEvent
);


module.exports = eventRouter;