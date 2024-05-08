const { DEPARTMENTS } = require("../../constants/departments.constants");
const { ROLES } = require("../../constants/role.constants");
const eventModel = require("../../models/event.model");
const { StatusCodes } = require("http-status-codes");

const createEvent = async (req, res, next) => {
    try {
        if (!DEPARTMENTS[req.body.department]) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid department. Valid departments are " + Object.values(DEPARTMENTS).join(", "),
            });
        }
        if (req.user.role !== ROLES.SUPER_ADMIN && req.user.department !== req.body.department) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "You are not authorized to create events for this department",
            });
        }
        const newEvent = await new eventModel({
            ...req.body,
            createdBy: req.user._id,
        }).save();

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Event created successfully",
            data: newEvent,
        });
    } catch (error) {
        next(error);
    }
}

const getEvents = async (req, res, next) => {
    try {
        let events = [];
        if (req.user.role===ROLES.SUPER_ADMIN) {
            events = await eventModel.find({});
        } else {
            events = await eventModel.find({ $or: [
                {
                    createdBy: req.user._id
                }, {
                    department: req.user.department
                }
            ]});
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Events fetched successfully",
            data: events,
        });
    } catch (error) {
        next(error);
    }
}

const deleteEvent = async (req, res, next) => {
    try {
        const event = await eventModel.findOne({ _id: req.params.id });

        if (!event) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Event not found",
            });
        }

        if (req.user.role === ROLES.SUPER_ADMIN || req.user._id === event.createdBy) {
            const deleted = await eventModel.deleteOne({ _id: event._id });
            return res.status(StatusCodes.OK).json({
                success: true,
                message: "Event deleted successfully",
                deleted,
            });
        } else {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "You are not authorized to delete this event",
            });
        }

    } catch (error) {
        next(error);
    }
}


module.exports = {
    createEvent,
    getEvents,
    deleteEvent,
}