
const cron = require("node-cron");
const { createNotification } = require("../notification/notification.controller");
const { sendEmail } = require("../../services/email.services");
const { getUpcomingEmailNotificationContent } = require("../../emails/notification.html");
const models = require("../../models/index.model");
const { NOTIFICATION_CONTEXT, DONOT_DISTURB_STATE } = require("../../constants/notification.constants");
const { timeDifference } = require("../../utils/date.utils");
const { RECURRING_TYPES } = require("../../constants/event.constants");
const { generateOccurrences } = require("../event/event.controller");


// schedule a cron job to run every 5 minutes that checks for events that are about to start in 1 hour and sends notification as well as email to the users
const sendOngoingEventsNotification = async () => {
    try {
        let nonRecurringEvents = await models.eventModel.find({
            recurringType: RECURRING_TYPES.NONE,
            notifiedDates: { $size: 0, },
            start: {
                $gte: new Date(),
                $lte: new Date(Date.now() + (60 * 60 * 1000)),
            },
        }).populate("involvedUsers").populate("departments").populate("createdBy");

        let recurringEvents = await models.eventModel.find({
            recurringType: { $ne: RECURRING_TYPES.NONE },
            recurrenceEnd: { $gte: new Date() + (60 * 60 * 1000) },
        }).populate("involvedUsers").populate("departments").populate("createdBy");

        let recurringEventsWithOccurrences = [];

        recurringEvents.forEach(event => {
            if (new Date(event.start) < new Date()) {
                return;
            }
            
            if (event.notifiedDates.length > 0 && event.notifiedDates[event.notifiedDates.length - 1] > (new Date() - (60 * 60 * 1000))) {
                return;
            }

            const occurrences = generateOccurrences(event);
            recurringEventsWithOccurrences = recurringEventsWithOccurrences.concat(occurrences);
        });

        let allEvents = [
            ...nonRecurringEvents,
            ...recurringEventsWithOccurrences,
        ];

        for (let event of allEvents) {
            const differenceString = timeDifference(event.start);
            let emailUsers = [];
            emailUsers = emailUsers.concat(event.involvedUsers);
            emailUsers = emailUsers.concat(await models.userModel.find({ department: { $in: event.departments?.map(d=>d._id) } }));
            if (event.createdBy) {
                emailUsers = emailUsers.concat(event.createdBy);
            }
            for (let user of emailUsers) {
                if (user.donotDisturbState !== DONOT_DISTURB_STATE.DEFAULT && user.notificationExpiry && new Date() < new Date(user.notificationExpiry)) {
                    continue;
                }
                await createNotification({
                    context: NOTIFICATION_CONTEXT.UPCOMING_EVENT,
                    contextId: event._id,
                    message: `Event ${event.title} is about to start in ${differenceString}`,
                    user: user._id,
                });

                await sendEmail({
                    to: [user.email],
                    cc: [],
                    bcc: [],
                    subject: `Upcoming Event in ${differenceString}`,
                    html: getUpcomingEmailNotificationContent(user.username, event),
                });
            }
            await models.eventModel.updateOne({ _id: event._id }, { $push: { notifiedDates: new Date() } });
        }
    } catch (error) {
        console.error("Error in events cron job", error);
    }
}

const scheduleOngoingEventsJob = () => cron.schedule("*/5 * * * *", sendOngoingEventsNotification);

module.exports = {
    sendOngoingEventsNotification,
    scheduleOngoingEventsJob,
};
