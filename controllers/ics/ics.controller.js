const { createEvents } = require('ics');
const ical = require('ical');
const models = require("../../models/index.model");
const { StatusCodes } = require('http-status-codes');
const { getDepartmentByIdOrCode } = require('../department/department.controller');
const { ROLES } = require('../../constants/role.constants');

const convertEventsToIcs = async (req, res, next) => {
    try {
        const departments = req.body.departments;
        let events;
        if (req.user.role !== ROLES.SUPER_ADMIN) {
            events = await models.eventModel.find({
                departments: req.user.department._id
            }).populate('createdBy').populate('involvedUsers').populate('departments');
        } else {
            let filter = {};
            let departmentsToFilter;
            if (departments && departments.length > 0) {
                departmentsToFilter = await Promise.all(departments.map(async department => {
                    let { data: departmentObj } = await getDepartmentByIdOrCode(department);
                    if (!departmentObj) return null;
                    return departmentObj._id.toString();
                }));
                departmentsToFilter = departmentsToFilter.filter(department => department !== null);
            } else {
                departmentsToFilter = (await models.departmentModel.find({})).map(department => department._id.toString());
            }
            if (departmentsToFilter.length > 0) {
                filter.departments = { $in: departmentsToFilter };
            }

            events = await models.eventModel.find(filter).populate('createdBy').populate('involvedUsers').populate('departments');
        }

        if (!events || events.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No events found to export'
            });
        }

        const eventDetailsArray = await Promise.all(events.map(async event => {
            let attendees = event.involvedUsers.map(user => ({
                name: user.username, email: user.email
            }));

            for (let department of event.departments) {
                const departmentUsers = await models.userModel.find({ department: department._id });
                attendees = [...attendees, ...departmentUsers.map(user => ({
                    name: user.username, email: user.email
                }))];
            }
            const start = new Date(event.start);
            const end = new Date(event.end);
            return {
                title: event.title,
                description: event.description,
                start: [
                    start.getFullYear(),
                    start.getMonth() + 1,
                    start.getDate(),
                    start.getHours(),
                    start.getMinutes(),
                ],
                end: [
                    end.getFullYear(),
                    end.getMonth() + 1,
                    end.getDate(),
                    end.getHours(),
                    end.getMinutes(),
                ],
                location: event.location,
                organizer: { name: event.createdBy.username, email: event.createdBy.email },
                attendees,
            }
        }));
        console.log("Event Details Array: ", eventDetailsArray)
        createEvents(eventDetailsArray, (error, value) => {
            if (error) {
                console.log("Create Events Error:");
                console.error(error)
                return next(error);
            }
            return res.status(StatusCodes.OK).json({ success: true, message: "Successfully exported to ICS string!" ,data: value });
        });
    } catch (error) {
        return next(error);
    }
};


const convertIcsToEvents = async (req, res, next) => {
    try {
        const { icsString, departments } = req.body;

        if (!icsString) {
            return res.status(400).json({ error: 'ICS string is required' });
        }

        let departmentIds = [];

        if (req.user.department) {
            departmentIds.push(req.user.department._id.toString());
        } else if (req.user.role === ROLES.STAFF) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: 'Staff members must belong to a department to create events'
            });
        }

        if (departments && departments.length > 0) {
            let ids = await Promise.all(departments.map(async department => {
                let { data: departmentObj } = await getDepartmentByIdOrCode(department);
                return departmentObj._id.toString();
            }));
            departmentIds = [...departmentIds, ...ids];
        }

        departmentIds = Array.from(new Set(departmentIds));

        const parsedEvents = ical.parseICS(icsString);
        const eventsToSave = [];

        for (const key in parsedEvents) {
            const event = parsedEvents[key];

            if (event.type === 'VEVENT') {
                let { summary: title, description, start, end, location, organizer, attendee } = event;
                if (!title || !start || !end) continue;
                if (!description) description = '-';
                if (!location) location = '-';
                let involvedUsers = [];
                if (attendee && attendee.length && attendee.length > 0) {
                    involvedUsers = attendee.map(attendee => attendee.val.replace("mailto:", ""));
                }
                let existingUserIds = (await models.userModel.find({
                    email: { $in: involvedUsers }
                })).map(user => user._id.toString());


                const eventObj = new models.eventModel({
                    title,
                    description: description,
                    start: new Date(start),
                    end: new Date(end),
                    location: location,
                    createdBy: req.user.id,
                    departments: departmentIds,
                    involvedUsers: existingUserIds,
                    color: event.color || '',
                    notes: event.notes || ''
                });

                eventsToSave.push(eventObj);
            }
        }

        const savedEvents = await models.eventModel.insertMany(eventsToSave);
        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Events saved successfully',
            data: savedEvents
        });

    } catch (error) {
        console.error('Error parsing ICS string:', error);
        return next(error);
    }
};

module.exports = { convertEventsToIcs, convertIcsToEvents };
