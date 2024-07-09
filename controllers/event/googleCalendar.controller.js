const { StatusCodes } = require("http-status-codes");
const { decrypt } = require("../../services/encryption.services");
const { google } = require("googleapis");
const models = require("../../models/index.model");

const getGoogleEvents = (req, res, next) => {
    const calendar = google.calendar({ version: 'v3', auth: req.googleAuthClient });
    calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
    }, (err, response) => {
        if (err) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to fetch events',
                error: err.message,
            });
        }
        const events = response.data.items;
        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Events fetched successfully',
            data: events,
        });
    });
}

const syncGoogleEvents = async (req, res, next) => {

    try {
        const calendar = google.calendar({ version: 'v3', auth: req.googleAuthClient });
        let localsyncedEvents = await models.syncedEventModel.find({ user: req.user.id }).populate('event');
        let localSyncedEventIds = localsyncedEvents.map((event) => event.event._id);
        let localUnSyncedEvents = await models.eventModel.find({ _id: { $nin: localSyncedEventIds } });

        console.log("Unsynced Exported: ", localUnSyncedEvents);

        let insertedEvents = await Promise.all(localUnSyncedEvents.map(async (event) => {
            const newEvent = await calendar.events.insert({
                calendarId: 'primary',
                auth: req.googleAuthClient,
                resource: {
                    summary: event.title,
                    description: `${event.description}`,
                    start: {
                        dateTime: event.start,
                        timeZone: 'Asia/Kathmandu',
                    },

                    end: {
                        dateTime: event.end,
                        timeZone: 'Asia/Kathmandu',
                    },
                    location: event.location,
                    // colorId: event.color,
                },
            })
            let newSyncedEvent = await new models.syncedEventModel({
                user: req.user.id,
                event: event._id,
                googleEventId: newEvent.data.id,
            }).save();
            newSyncedEvent = newSyncedEvent.toObject();
            newSyncedEvent.event = event;
            return newSyncedEvent;
        }));

        localsyncedEvents = localsyncedEvents.concat(insertedEvents);
        console.log('Inserted Events', insertedEvents);
        const currentDate = new Date();
        let calendarEventsUnsynced = await calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date(currentDate.setDate(currentDate.getDate() - 45)).toISOString(),
            maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime',
        });

        console.log('Unsynced Events: ', calendarEventsUnsynced.data.items)

        calendarEventsUnsynced = calendarEventsUnsynced.data.items.filter((event) => {
            return !localsyncedEvents.find((localEvent) => localEvent.googleEventId === event.id);
        });

        let importedEvents = await Promise.all(
            calendarEventsUnsynced.map(async (event) => {
                console.log("GOOGLE EVENT: ", event);
                if (!(event.summary && event.summary?.length > 0)) {
                    return "Summary not found";
                }
                const importedEvent = await new models.eventModel({
                    title: event.summary ?? "--",
                    description: event.description ?? "--",
                    start: event.start.dateTime,
                    end: event.end.dateTime,
                    location: event.location ?? "--",
                    involvedUsers: [req.user.id],
                    // color: event.colorId,
                }).save();
                let newSyncedEvent = await new models.syncedEventModel({
                    user: req.user.id,
                    event: importedEvent._id,
                    googleEventId: event.id,
                }).save();
                newSyncedEvent = newSyncedEvent.toObject();
                newSyncedEvent.event = importedEvent;
                return newSyncedEvent;
            })
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Events inserted successfully',
            data: { insertedEvents, importedEvents },
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

module.exports = {
    getGoogleEvents,
    syncGoogleEvents,
}
