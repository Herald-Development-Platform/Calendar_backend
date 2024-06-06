const { createEvents } = require('ics');
const ical = require('ical');
const models = require("../../models/index.model");
const { StatusCodes } = require('http-status-codes');

const convertEventsToIcs = async (req, res, next) => {
    try {
        const departmentId = req.query.departmentId;
        let events;

        if (departmentId) {
            events = await models.eventModel.find({ departments: departmentId })
                .populate('departments')
                .populate('involvedUsers')
                .populate('createdBy');
        } else {
            events = await models.eventModel.find({})
                .populate('departments')
                .populate('involvedUsers')
                .populate('createdBy');
        }

        if (!events || events.length === 0) {
            return res.status(404).json({ error: 'No events found' });
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
            res.setHeader('Content-Disposition', 'attachment; filename=events.ics');
            res.setHeader('Content-Type', 'text/calendar');
            res.send(value);
        });
    } catch (error) {
        return next(error);
    }
};


const convertIcsToEvents = async (req, res, next) => {
    try {
        const { icsString, department } = req.body;

        if (!icsString) {
            return res.status(400).json({ error: 'ICS string is required' });
        }

        const parsedEvents = ical.parseICS(icsString);

        const {data: departmentData} = await models.departmentModel.findById(department);
        if (!departmentData) {
            return res.status(400).json({ error: 'Invalid department ID' });
        }

        const eventsToSave = [];

        for (const key in parsedEvents) {
            const event = parsedEvents[key];
            console.log(event);
            continue;

            if (event.type === 'VEVENT') {
                const { summary, description, start, end, location, organizer, attendees } = event;

                const eventObj = new models.eventModel({
                    title: summary,
                    description: description,
                    start: new Date(start),
                    end: new Date(end),
                    location: location,
                    createdBy: await models.userModel.findOne({ email: organizer?.val }),
                    departments: [department],
                    involvedUsers: await models.userModel.find({ email: { $in: (attendees || []).map(attendee => attendee.val) } }),
                    color: event.color || '',
                    notes: event.notes || ''
                });

                eventsToSave.push(eventObj);
            }
        }

        // const savedEvents = await models.eventModel.insertMany(eventsToSave);
        // res.status(201).json(savedEvents);
        res.status(StatusCodes.OK).json({ message: 'Events saved successfully' });

    } catch (error) {
        console.error('Error parsing ICS string:', error);
        return next(error);
    }
};

module.exports = { convertEventsToIcs, convertIcsToEvents };
