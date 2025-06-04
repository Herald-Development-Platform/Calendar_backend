const eventRouter = require("express").Router();
const { checkPermissions } = require("../middlewares/permission.middleware");

const { PERMISSIONS } = require("../constants/permissions.constants");

const {
  createEvent,
  getEvents,
  deleteEvent,
  updateEvent,
} = require("../controllers/event/event.controller");

const {
  convertEventsToIcs,
  convertIcsToEvents,
} = require("../controllers/ics/ics.controller");

const {
  verifyToken,
  isGoogleAuthorized,
} = require("../middlewares/auth.middleware");
const {
  getGoogleEvents,
  syncGoogleEvents,
} = require("../controllers/event/googleCalendar.controller");

eventRouter.post("/event/exportIcs", verifyToken, convertEventsToIcs);
eventRouter.post("/event/fromIcs", verifyToken, convertIcsToEvents);
eventRouter.post("/event", verifyToken, createEvent);
eventRouter.get("/event", verifyToken, getEvents);
eventRouter.put("/event/:id", verifyToken, updateEvent);
eventRouter.delete("/event/:id", verifyToken, isGoogleAuthorized(), deleteEvent);

eventRouter.get(
  "/google/events",
  verifyToken,
  isGoogleAuthorized(false),
  getGoogleEvents
);

eventRouter.post(
  "/google/sync",
  verifyToken,
  isGoogleAuthorized(false),
  syncGoogleEvents
);

module.exports = eventRouter;
