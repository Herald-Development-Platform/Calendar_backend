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
        const unSyncedEvents = await models.eventModel.find({ isSynced: false });
        const events = await calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });

        console.log("Unsynced Events", unSyncedEvents);

        const insertedEvents = await Promise.all(unSyncedEvents.map(async (event) => {
            const newEvent = calendar.events.insert({
                calendarId: 'primary',
                auth: req.googleAuthClient,
                resource: {
                    summary: event.title,
                    description: `${event.description}`,
                    start: {
                        dateTime: event.startDate,
                        timeZone: 'Asia/Kathmandu',
                    },
                    end: {
                        dateTime: event.endDate,
                        timeZone: 'Asia/Kathmandu',
                    },
                    // how to insert the location of event. I don't know the key for location
                    location: event.location,
                    colorId: event.color,
                },
            })
            await models.eventModel.findByIdAndUpdate(event._id, { isSynced: true, googleCalendarId: newEvent.data.id });
        }));

        console.log('Inserted Events', insertedEvents);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Events inserted successfully',
            data: insertedEvents,
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
