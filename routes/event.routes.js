const eventRouter = require("express").Router();

// Importing Controllers
const {
    createEvent,
    getEvents,
    deleteEvent,
} = require("../controllers/event/event.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// Event Routes
eventRouter.post("/event", verifyToken, createEvent);
eventRouter.get("/event", verifyToken, getEvents);
eventRouter.delete("/event/:id", verifyToken, deleteEvent);


module.exports = eventRouter;