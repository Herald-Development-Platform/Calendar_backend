const { ROLES } = require("../../constants/role.constants");
const models = require("../../models/index.model");
const { StatusCodes } = require("http-status-codes");
const { getDepartmentById } = require("../department/department.controller");

const createEvent = async (req, res, next) => {
    try {
        const department = await getDepartmentById(req.body.department);
        if (!req.body.department) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Department not found!",
            });
        }
        if (req.user.department.toString() !== department._id.toString() && req.user.role !== ROLES.SUPER_ADMIN) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "You are not authorized to create event for this department",
            });
        }
        const newEvent = await new models.eventModel({
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
        let { q } = req.query;
        if (!q) q = "";
        let events = [];
        if (req.user.role === ROLES.SUPER_ADMIN) {
            let query = {};
            const departments = req.body.departments;
            if (departments && departments.length > 0) {
                query = { departments: { $in: departments } };
            }
            events = await models.eventModel.find(query).sort({ start: 1 });
        } else {
            events = await models.eventModel.find({
                $or: [
                    {
                        createdBy: req.user._id
                    },
                    {
                        departments: req.user.department
                    }
                ],
                $or: [
                    {
                        title: { $regex: q, $options: "i" }
                    },
                    {
                        description: { $regex: q, $options: "i" }
                    },
                    {
                        location: { $regex: q, $options: "i" }
                    },
                    {
                        notes: { $regex: q, $options: "i" }
                    },
                ]
            }).sort({ date: 1 });
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
        const event = await models.eventModel.findOne({ _id: req.params.id });

        if (!event) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Event not found",
            });
        }

        if (
            req.user.role === ROLES.SUPER_ADMIN ||
            event?.departments[0] === req.user.department.toString()
        ) {
            const deleted = await models.eventModel.findByIdAndDelete(event._id);
            return res.status(StatusCodes.OK).json({
                success: true,
                message: "Event deleted successfully",
                data: deleted,
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

const updateEvent = async (req, res, next) => {
    try {
        const event = await models.eventModel.findOne({ _id: req.params.id });

        if (!event) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Event not found",
            });
        }

        if (
            req.user.role === ROLES.SUPER_ADMIN ||
            event?.departments[0] === req.user.department.toString()
        ) {
            const updated = await models.eventModel.findByIdAndUpdate(event._id, req.body, {
                new: true,
            });
            return res.status(StatusCodes.OK).json({
                success: true,
                message: "Event updated successfully",
                data:updated,
            });
        } else {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "You are not authorized to update this event",
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
    updateEvent,
}