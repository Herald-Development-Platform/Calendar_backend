const { createEvent } = require('ics');

const { createEvents } = require('ics');
const EventModel = require('../../models/event.model');
const DepartmentModel = require('../../models/department.model');
const userModel = require('../../models/user.model');

const convertEventsToIcs = async (req, res, next) => {
    try {
        const departmentId = req.query.departmentId;
        let events;

        if (departmentId) {
            events = await EventModel.find({ departments: departmentId })
                .populate('departments')
                .populate('involvedUsers')
                .populate('createdBy');
        } else {
            events = await EventModel.find({})
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
                const departmentUsers = await userModel.find({ department: department._id });
                attendees = [...attendees, ...departmentUsers.map(user => ({
                    name: user.username, email: user.email
                }))];
            }
            const start = new Date(event.start);
            const end = new Date(event.end);
            console.log(start, end);
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

module.exports = { convertEventsToIcs };
