const { ROLES } = require("../../constants/role.constants");
const models = require("../../models/index.model");
const crypto = require("crypto");
const { StatusCodes } = require("http-status-codes");
const {
  getDepartmentByIdOrCode,
} = require("../department/department.controller");
const { RECURRING_TYPES } = require("../../constants/event.constants");
const { PERMISSIONS } = require("../../constants/permissions.constants");
const {
  NOTIFICATION_CONTEXT,
  DONOT_DISTURB_STATE,
} = require("../../constants/notification.constants");
const {
  getNewEventNotificationEmailContent,
  getEventUpdatedNotificationEmailContent,
  getEventDeletedNotificationEmailContent,
} = require("../../emails/notification.html");
const {
  createNotification,
} = require("../notification/notification.controller");
const { sendEmail } = require("../../services/email.services");
const { sendNotification } = require("../websocket/socket.controller");

const sendNewEventCreatedEmail = async (event) => {
  let departmentUsers = [];
  await Promise.all(
    event.departments.map(async (department) => {
      let currentDepartmentUsers = await models.userModel.find({
        department,
      });
      departmentUsers = departmentUsers.concat(currentDepartmentUsers);
    })
  );

  await Promise.all(
    event.involvedUsers.map(async (userID) => {
      const user = await models.userModel.findById(userID);
      if (!user) {
        throw new Error("User not found");
      }
      departmentUsers.push(user);
    })
  );
  const superAdminUsers = await models.userModel.find({ role: "SUPER_ADMIN" });
  departmentUsers = departmentUsers.concat(superAdminUsers);
  // departmentUsers = departmentUsers.filter((user) => {
  //   return user.donotDisturbState === DONOT_DISTURB_STATE.DEFAULT
  //     || new Date() >= new Date(user.notificationExpiry);
  // });
  // departmentUsers = Array.from(new Set(departmentUsers));
  let eventDepartments = await models.departmentModel.find({
    _id: { $in: event.departments?.map(d => d?.toString() ?? "-") },
  });
  eventDepartments = eventDepartments.map((d) => d.toObject());
  let createdByUser = await models.userModel.findById(event.createdBy);
  createdByUser = createdByUser.toObject();
  departmentUsers = departmentUsers.map((user) => {
    const notification = createNotification({
      user: user._id,
      contextId: event._id,
      context: NOTIFICATION_CONTEXT.NEW_EVENT,
      message: `New Event Created: ${event.title}`,
    });
    console.log("Notification User: ", user.email);
    if (user.donotDisturbState === DONOT_DISTURB_STATE.DEFAULT
      || new Date() >= new Date(user.notificationExpiry)) {
      const emailContent = getNewEventNotificationEmailContent(
        user.username,
        {
          ...(event.toObject()),
          departments: eventDepartments,
          createdBy: createdByUser,
        }
      );
      try {
        sendEmail(user.email, [], [], "New Event Created:"+event?.title ?? "", emailContent);
      } catch (error) {
        console.error("ERROR SENDING NEW EVENT EMAIL:", error?.message);
      }
    }
  });
};

const sendEventUpdatedEmail = async (event) => {
  let departmentUsers = [];
  await Promise.all(
    event.departments.map(async (department) => {
      let currentDepartmentUsers = await models.userModel.find({
        department,
      });
      departmentUsers = departmentUsers.concat(currentDepartmentUsers);
    })
  );

  await Promise.all(
    event.involvedUsers.map(async (userID) => {
      const user = await models.userModel.findById(userID);
      if (!user) {
        throw new Error("User not found");
      }
      departmentUsers.push(user);
    })
  );
  const superAdminUsers = await models.userModel.find({ role: "SUPER_ADMIN" });
  departmentUsers = departmentUsers.concat(superAdminUsers);
  // departmentUsers = departmentUsers.filter((user) => {
  //   return user.donotDisturbState === DONOT_DISTURB_STATE.DEFAULT
  //     || new Date() >= new Date(user.notificationExpiry);
  // });
  // departmentUsers = Array.from(new Set(departmentUsers));

  let eventDepartments = await models.departmentModel.find({
    _id: { $in: event.departments?.map(d => d?.toString() ?? "-") },
  });

  eventDepartments = eventDepartments.map((d) => d.toObject());
  let createdByUser = await models.userModel.findById(event.createdBy);
  createdByUser = createdByUser.toObject();

  departmentUsers = departmentUsers.map((user) => {
    const notification = createNotification({
      user: user._id,
      contextId: event._id,
      context: NOTIFICATION_CONTEXT.EVENT_RESCHEDULED,
      message: `Event Updated: ${event.title}`,
    });
    if (
      user.donotDisturbState === DONOT_DISTURB_STATE.DEFAULT 
      || new Date() >= new Date(user.notificationExpiry)
    ) {
      const emailContent = getEventUpdatedNotificationEmailContent(
        user.username,
        {
          ...event.toObject(),
          departments: eventDepartments,
          createdBy: createdByUser,
        }
      );
      sendEmail(user.email, [], [], "Event Updated:"+event?.title ?? "", emailContent);
    }
  });
};

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
    if (new Date(req.body.start) >= new Date(req.body.end)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "'start' should be less than 'end'",
      });
    }
    if (!req.body.recurrenceEnd) {
      delete req.body.recurrenceEnd;
    }
    const newEvent = await new models.eventModel({
      ...req.body,
      createdBy: req.user._id,
    }).save();

    sendNewEventCreatedEmail(newEvent);

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Event created successfully",
      data: newEvent,
    });
  } catch (error) {
    next(error);
  }
};

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
    currentDate = new Date(currentDate);
    let endDate = new Date(
      currentDate.getTime() + (new Date(event.end).getTime() - new Date(event.start).getTime())
    );
    if (
      event.exceptionRanges &&
      event.exceptionRanges.length > 0
    ) {
      const isException = event.exceptionRanges.some((range) => {
        return new Date(range.start).getTime() <= currentDate.getTime() && new Date(range.end).getTime() >= endDate.getTime();
      });

      if (isException) {
        incrementDate(currentDate, event.recurringType);
        continue;
      }
    }
    let nonDuplicateId = `${event._id}-${crypto.randomBytes(4).toString("hex")}`;
    let occurrence = {
      ...event,
      start: new Date(currentDate.toISOString()),
      end: new Date(endDate.toISOString()),
      _id: nonDuplicateId,
      id: nonDuplicateId,
    };
    occurrences.push(occurrence);
    incrementDate(currentDate, event.recurringType);
  }

  return occurrences;
};

const getEvents = async (req, res, next) => {
  try {
    let { q, colors, eventFrom, eventTo, recurrenceType } = req.query;
    if (!q) q = "";
    let events = [];
    let query = {};

    if (
      req.user.role === ROLES.SUPER_ADMIN ||
      req.user.permissions.includes(PERMISSIONS.VIEW_EVENTS_FOR_ALL_DEPARTMENT)
    ) {
      let departments = req.query.departments;
      if (departments && departments.length > 0) {
        departments = departments.split(",");
        query = { departments: { $in: departments } };
      }
      if (colors) {
        colors = colors.replaceAll("#", "");
        colors = colors.split(",");
        query.color = { $in: colors.map((c) => new RegExp(c, "i")) };
      }

      if (q) {
        query["$or"] = [
          { title: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { location: { $regex: q, $options: "i" } },
          { notes: { $regex: q, $options: "i" } },
        ];
      }

      if (eventFrom) {
        query.start = { $gte: new Date(Number(eventFrom)) };
      }
      if (eventTo) {
        query.end = { $lte: new Date(Number(eventTo)) };
      }
      if (recurrenceType) {
        query.recurringType = { $regex: new RegExp(recurrenceType, "i") };
      }
      events = await models.eventModel
        .find({
          ...query,
        })
        .populate("departments").populate("createdBy", "email username photo _id role")
        .sort({ start: 1 });
    } else {
      query = {
        $and: [{ departments: req.user.department }],
      };
      if (colors) {
        colors = colors.replaceAll("#", "");
        colors = colors.split(",");
        query["$and"].push({
          color: { $in: colors.map((c) => new RegExp(c, "i")) },
        });
      }
      if (q) {
        query["$and"].push({
          $or: [
            { title: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } },
            { location: { $regex: q, $options: "i" } },
            { notes: { $regex: q, $options: "i" } },
          ],
        });
      }
      if (eventFrom) {
        query["$and"].push({ start: { $gte: new Date(Number(eventFrom)) } });
      }
      if (eventTo) {
        query["$and"].push({ end: { $lte: new Date(Number(eventTo)) } });
      }
      if (recurrenceType) {
        query["$and"].push({
          recurringType: { $regex: new RegExp(recurrenceType, "i") },
        });
      }
      events = await models.eventModel
        .find({
          ...query,
        })
        .populate("departments").populate("createdBy", "email username photo _id role")
        .sort({ start: 1 });
    }

    let allEvents = [];
    events.map((event) => {
      if (event.toObject) {
        event = event.toObject();
      } else {
        event = { ...event };
      }
      if (event.color === "#49449C") {
        event.departments = [
          {
            _id: crypto.randomBytes(4).toString("hex"),
            name: "Google",
            code: "GOGL",
            description: "Imported from google calendar",
            admins: [],
          },
          ...(event.departments),
        ]
      }
      if (event.recurringType !== RECURRING_TYPES.NONE && new Date(event.recurrenceEnd).toString() !== "Invalid Date" && Object.values(RECURRING_TYPES).includes(event.recurringType)) {
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
    const event = await models.eventModel.findOne({ _id: req.params.id.split("-")[0] });

    if (!event) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Event not found",
      });
    }

    if (
      req.user.role === ROLES.SUPER_ADMIN ||
      event?.createdBy?.toString() === req.user?.id?.toString() ||
      (event?.departments[0]?.toString() === req.user.department._id.toString() && req.user.role === ROLES.DEPARTMENT_ADMIN)
    ) {
      const notificationUsers = await models.userModel.find({
        $or: [
          { department: { $in: event.departments } },
          { _id: { $in: event.involvedUsers } },
        ],
      });

      const deleted = await models.eventModel.findByIdAndDelete(event._id);

      if (deleted.end > new Date()) {
        notificationUsers.map((user) => {
          createNotification({
            user: user._id,
            contextId: event._id,
            context: NOTIFICATION_CONTEXT.EVENT_CANCELLED,
            message: `Event Deleted: ${event.title}`,
          });

          sendEmail(
            [user?.email],
            [],
            [],
            "Event Cancelled:"+event?.title ?? "",
            getEventDeletedNotificationEmailContent(user?.username, event?.toObject())
          );
        });
      }


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
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await models.eventModel.findOne({ _id: req.params.id.split("-")[0] });
    delete req.body._id;
    delete req.body.id;
    if (!event) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Event not found",
      });
    }

    if (
      req.user.role === ROLES.SUPER_ADMIN ||
      event?.createdBy?.toString() === req.user?.id?.toString() ||
      event?.departments[0]?.toString() === req.user.department._id.toString()
    ) {
      const departmentCodes = req.body.departments;
      let departmentsIds = await Promise.all(
        departmentCodes.map(async (code) => {
          const { data: departmentData } = await getDepartmentByIdOrCode(code);
          return departmentData?._id;
        })
      );
      console.log("event req.params.id: ", event);
      req.body.departments = departmentsIds.filter((val) => val);

      const updated = await models.eventModel.findByIdAndUpdate(
        event._id,
        req.body,
        {
          new: true,
        }
      );
      if (req.body.notifyUpdate) {
        sendEventUpdatedEmail(updated);
      }
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
};

module.exports = {
  createEvent,
  getEvents,
  generateOccurrences,
  deleteEvent,
  updateEvent,
  sendNewEventCreatedEmail,
};
