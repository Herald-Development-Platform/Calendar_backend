const { StatusCodes } = require("http-status-codes");
const { decrypt } = require("../../services/encryption.services");
const { google } = require("googleapis");
const models = require("../../models/index.model");

const getGoogleEvents = (req, res, next) => {
  const calendar = google.calendar({
    version: "v3",
    auth: req.googleAuthClient,
  });
  calendar.events.list(
    {
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    },
    (err, response) => {
      if (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Failed to fetch events",
          error: err.message,
        });
      }
      const events = response.data.items;
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Events fetched successfully",
        data: events,
      });
    }
  );
};

// const syncGoogleEvents = async (req, res, next) => {
//     try {
//         const calendar = google.calendar({ version: 'v3', auth: req.googleAuthClient });

//         console.log("Starting sync for user:", req.user.id);

//         // Step 1: Fetch already synced local events
//         let localsyncedEvents = await models.syncedEventModel.find({ user: req.user.id }).populate('event');
//         let localSyncedEventIds = localsyncedEvents.map((synced) => synced.event?._id?.toString());

//         // Step 2: Get unsynced local events
//         let localUnSyncedEvents = await models.eventModel.find({
//             _id: { $nin: localSyncedEventIds },
//             createdBy: req.user.id // Optional: ensure user is syncing only their own events
//         });

//         console.log("Local unsynced events:", localUnSyncedEvents.length);

//         // Step 3: Sync local events to Google Calendar
//         let insertedEvents = await Promise.all(localUnSyncedEvents.map(async (event) => {
//             try {
//                 const newEvent = await calendar.events.insert({
//                     calendarId: 'primary',
//                     resource: {
//                         summary: event.title,
//                         description: event.description ?? '',
//                         start: {
//                             dateTime: new Date(event.start).toISOString(),
//                             timeZone: 'Asia/Kathmandu',
//                         },
//                         end: {
//                             dateTime: new Date(event.end).toISOString(),
//                             timeZone: 'Asia/Kathmandu',
//                         },
//                         location: event.location ?? '',
//                     },
//                 });

//                 console.log("Inserted event to Google:", newEvent.data.id);

//                 let newSyncedEvent = await new models.syncedEventModel({
//                     user: req.user.id,
//                     event: event._id,
//                     googleEventId: newEvent.data.id,
//                 }).save();

//                 newSyncedEvent = newSyncedEvent.toObject();
//                 newSyncedEvent.event = event;

//                 return newSyncedEvent;

//             } catch (error) {
//                 console.error("Failed to insert event to Google Calendar:", event.title, "-", error.message);
//                 return { error: error.message, event };
//             }
//         }));

//         localsyncedEvents = localsyncedEvents.concat(insertedEvents);

//         // Step 4: Get recent Google events
//         const currentDate = new Date();
//         const fortyFiveDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 45)).toISOString();

//         let calendarEventsResponse = await calendar.events.list({
//             calendarId: 'primary',
//             timeMin: fortyFiveDaysAgo,
//             maxResults: 100,
//             singleEvents: true,
//             orderBy: 'startTime',
//         });

//         let calendarEventsUnsynced = calendarEventsResponse.data.items.filter((event) => {
//             return !localsyncedEvents.some(local => local.googleEventId === event.id);
//         });

//         console.log("Google events to import locally:", calendarEventsUnsynced.length);

//         // Step 5: Import Google Calendar events to local DB
//         let importedEvents = await Promise.all(calendarEventsUnsynced.map(async (event) => {
//             if (!(event.summary && event.summary.length > 0)) {
//                 return "Skipped event with no summary";
//             }

//             try {
//                 const startDate = event.start?.dateTime ?? new Date(event.start?.date).setHours(0, 0, 0, 0);
//                 const endDate = event.end?.dateTime ?? new Date(event.end?.date).setHours(23, 59, 59);

//                 const importedEvent = await new models.eventModel({
//                     title: event.summary ?? "--",
//                     description: event.description ?? "--",
//                     start: new Date(startDate),
//                     end: new Date(endDate),
//                     location: event.location ?? "--",
//                     departments: req.user.department ? [req.user.department] : [],
//                     involvedUsers: [req.user.id],
//                     createdBy: req.user.id,
//                     color: event.colorId ?? "#49449C",
//                 }).save();

//                 let newSyncedEvent = await new models.syncedEventModel({
//                     user: req.user.id,
//                     event: importedEvent._id,
//                     googleEventId: event.id,
//                 }).save();

//                 newSyncedEvent = newSyncedEvent.toObject();
//                 newSyncedEvent.event = importedEvent;

//                 return newSyncedEvent;

//             } catch (error) {
//                 console.error("Failed to import Google event:", event.summary, "-", error.message);
//                 return { error: error.message, event };
//             }
//         }));

//         return res.status(200).json({
//             success: true,
//             message: 'Events synced successfully',
//             data: {
//                 insertedEvents,
//                 importedEvents,
//             },
//         });

//     } catch (error) {
//         console.error("Sync error:", error);
//         next(error);
//     }
// };

const syncGoogleEvents = async (req, res, next) => {
  try {
    const calendar = google.calendar({
      version: "v3",
      auth: req.googleAuthClient,
    });

    console.log("Starting sync for user:", req.user.id);

    // Step 1: Already synced local events
    let localsyncedEvents = await models.syncedEventModel
      .find({ user: req.user.id })
      .populate("event");
    let localSyncedEventIds = localsyncedEvents.map((synced) =>
      synced.event?._id?.toString()
    );

    // Step 2: Unsynced local events
    let localUnSyncedEvents = await models.eventModel.find({
      _id: { $nin: localSyncedEventIds },
      createdBy: req.user.id,
    });

    localUnSyncedEvents = localUnSyncedEvents.filter((event) => {
      if (!event.personal) {
        return true;
      }
      return event.createdBy._id.toString() === req.user._id.toString();
    });

    console.log("Local unsynced events:", localUnSyncedEvents.length);

    // Step 3: Sync local to Google
    let insertedEvents = await Promise.all(
      localUnSyncedEvents.map(async (event) => {
        try {
          const newEvent = await calendar.events.insert({
            calendarId: "primary",
            resource: {
              summary: event.title,
              description: event.description ?? "",
              start: {
                dateTime: new Date(event.start).toISOString(),
                timeZone: "Asia/Kathmandu",
              },
              end: {
                dateTime: new Date(event.end).toISOString(),
                timeZone: "Asia/Kathmandu",
              },
              location: event.location ?? "",
            },
          });

          console.log("Inserted event to Google:", newEvent.data.id);

          let newSyncedEvent = await new models.syncedEventModel({
            user: req.user.id,
            event: event._id,
            googleEventId: newEvent.data.id,
          }).save();

          newSyncedEvent = newSyncedEvent.toObject();
          newSyncedEvent.event = event;

          return newSyncedEvent;
        } catch (error) {
          console.error(
            "Failed to insert event to Google Calendar:",
            event.title,
            "-",
            error.message
          );
          return { error: error.message, event };
        }
      })
    );

    localsyncedEvents = localsyncedEvents.concat(insertedEvents);

    // Step 4: Recent Google events
    const currentDate = new Date();
    const fortyFiveDaysAgo = new Date(
      currentDate.setDate(currentDate.getDate() - 45)
    ).toISOString();

    let calendarEventsResponse = await calendar.events.list({
      calendarId: "primary",
      timeMin: fortyFiveDaysAgo,
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });

    let calendarEvents = calendarEventsResponse.data.items;

    await removeLocallyDeletedGoogleEvents(req, calendarEvents);

    let calendarEventsUnsynced = calendarEventsResponse.data.items.filter(
      (event) => {
        return !localsyncedEvents.some(
          (local) => local.googleEventId === event.id
        );
      }
    );

    console.log(
      "Google events to import locally:",
      calendarEventsUnsynced.length
    );

    // Step 5: Import Google -> Local DB
    let importedEvents = await Promise.all(
      calendarEventsUnsynced.map(async (event) => {
        if (!(event.summary && event.summary.length > 0)) {
          return "Skipped event with no summary";
        }

        try {
          let startDate, endDate;

          if (event.start.dateTime && event.end.dateTime) {
            // Timed event
            startDate = new Date(event.start.dateTime);
            endDate = new Date(event.end.dateTime);
          } else {
            // All-day event
            startDate = new Date(event.start.date);
            endDate = new Date(event.end.date);
            endDate.setDate(endDate.getDate() - 1); // Fix: adjust exclusive end
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
          }

          const importedEvent = await new models.eventModel({
            title: event.summary ?? "--",
            description: event.description ?? "--",
            start: startDate,
            end: endDate,
            location: event.location ?? "--",
            departments: req.user.department ? [req.user.department] : [],
            involvedUsers: [req.user.id],
            createdBy: req.user.id,
            color: event.colorId ?? "#49449C",
            personal: true,
          }).save();

          let newSyncedEvent = await new models.syncedEventModel({
            user: req.user.id,
            event: importedEvent._id,
            googleEventId: event.id,
          }).save();

          newSyncedEvent = newSyncedEvent.toObject();
          newSyncedEvent.event = importedEvent;

          return newSyncedEvent;
        } catch (error) {
          console.error(
            "Failed to import Google event:",
            event.summary,
            "-",
            error.message
          );
          return { error: error.message, event };
        }
      })
    );

    return res.status(200).json({
      success: true,
      message: "Events synced successfully",
      data: {
        insertedEvents,
        importedEvents,
      },
    });
  } catch (error) {
    console.error("Sync error:", error);
    next(error);
  }
};

const removeLocallyDeletedGoogleEvents = async (req, calendarEvents) => {
  const googleEventIds = calendarEvents.map((event) => event.id);

  const syncedEvents = await models.syncedEventModel.find({
    user: req.user.id,
  });

  const eventsToDelete = syncedEvents.filter(
    (synced) => !googleEventIds.includes(synced.googleEventId)
  );

  for (const entry of eventsToDelete) {
    await models.eventModel.findByIdAndDelete(entry.event);
    await models.syncedEventModel.findByIdAndDelete(entry._id);
    console.log(
      `Deleted local event ${entry.event} (missing in Google Calendar)`
    );
  }
};

module.exports = {
  getGoogleEvents,
  syncGoogleEvents,
};
