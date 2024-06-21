const { ROLES } = require("../../constants/role.constants");
const models = require("../../models/index.model");
const { StatusCodes } = require("http-status-codes");
const { getDepartmentByIdOrCode } = require("../department/department.controller");
const { RECURRING_TYPES } = require("../../constants/event.constants");

const createEvent = async (req, res, next) => {
    try {
        if (req.user.role === ROLES.SUPER_ADMIN) {
            if (!req.body.departments || !req.body.departments?.length) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "'departments' is required",
                });
            }
        }

        let departments = [];
        if (req.user.department) {
            departments.push(req.user.department._id.toString());
        }
        for (let departmentID of req.body.departments) {
            let { data: department } = await getDepartmentByIdOrCode(departmentID);
            if (!department) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: `Department ${departmentID} not found!`,
                });
            }
            departments.push(department._id.toString());
        }

        req.body.departments = Array.from(new Set(departments));
        console.log(req.body.departments)
        // if (req.user?.department._id?.toString() !== departments[0] && req.user.role !== ROLES.SUPER_ADMIN) {
        //     return res.status(StatusCodes.UNAUTHORIZED).json({
        //         success: false,
        //         message: "You are not authorized to create event for this department",
        //     });
        // }

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
        let { q, colors } = req.query;
        if (!q) q = "";
        let events = [];
        let query = {};

        if (req.user.role === ROLES.SUPER_ADMIN) {
            let departments = req.query.departments;
            if (departments && departments.length > 0) {
                departments = departments.split(",");
                query = { departments: { $in: departments } };
            }
            if (colors) {
                colors = colors.replace("#", "");
                colors = colors.split(",");
                query.color = { $in: colors.map(c=>new RegExp(c,'i')) };
            }

            if (q) {
                query["$or"] = [
                    { title: { $regex: q, $options: "i" } },
                    { description: { $regex: q, $options: "i" } },
                    { location: { $regex: q, $options: "i" } },
                    { notes: { $regex: q, $options: "i" } },
                ];
            }
            events = await models.eventModel.find(query).populate("departments").sort({ start: 1 });
        } else {
            query = {
                $and: [
                    { departments: req.user.department },
                ]
            };
            if (color) query["$and"].push({ color: color });
            if (q) {
                query["$and"].push({
                    $or: [
                        { title: { $regex: q, $options: "i" } },
                        { description: { $regex: q, $options: "i" } },
                        { location: { $regex: q, $options: "i" } },
                        { notes: { $regex: q, $options: "i" } },
                    ]
                });
            }
            events = await models.eventModel.find(query).populate("departments").sort({ start: 1 });
        }

        const generateOccurrences = (event) => {
            let occurrences = [];
            let currentDate = new Date(event.start);
            const recurrenceEnd = new Date(event.recurrenceEnd);

            const incrementDate = (date, type) => {
                switch (type) {
                    case RECURRING_TYPES.DAILY:
                        date.setDate(date.getDate() + 1);
                        break;
                    case RECURRING_TYPES.WEEKLY:
                        date.setDate(date.getDate() + 7);
                        break;
                    case RECURRING_TYPES.MONTHLY:
                        date.setMonth(date.getMonth() + 1);
                        break;
                    case RECURRING_TYPES.YEARLY:
                        date.setFullYear(date.getFullYear() + 1);
                        break;
                    default:
                        break;
                }
            };

            while (currentDate <= recurrenceEnd) {
                let occurrence = {
                    ...event.toObject(),
                    start: new Date(currentDate),
                    end: new Date(new Date(currentDate).setMinutes(new Date(currentDate).getMinutes() + (event.end - event.start) / 60000)),
                };
                occurrences.push(occurrence);
                incrementDate(currentDate, event.recurringType);
            }

            return occurrences;
        };

        let allEvents = [];
        events.forEach(event => {
            if (event.recurringType !== RECURRING_TYPES.NONE && event.recurrenceEnd) {
                const occurrences = generateOccurrences(event);
                allEvents = allEvents.concat(occurrences);
            } else {
                allEvents.push(event);
            }
        });

        allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Events fetched successfully",
            data: allEvents,
        });
    } catch (error) {
        next(error);
    }
};


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
            event?.departments[0] === req.user?.department?._id?.toString()
        ) {
            const departmentCodes = req.body.departments;
            let departmentsIds = await Promise.all(departmentCodes.map(async (code) => {
                const { data: departmentData } = await getDepartmentByIdOrCode(code);
                return departmentData?._id;
            }));
            req.body.departments = departmentsIds.filter(val => val);


            const updated = await models.eventModel.findByIdAndUpdate(event._id, req.body, {
                new: true,
            });
            return res.status(StatusCodes.OK).json({
                success: true,
                message: "Event updated successfully",
                data: updated,
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