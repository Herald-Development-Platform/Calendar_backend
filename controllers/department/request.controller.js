const models = require("../../models/index.model");
const { StatusCodes } = require("http-status-codes");
const {
  getDepartmentByIdOrCode,
} = require("../department/department.controller");
const { sendEmail } = require("../../services/email.services");
const {
  getDepartmentRequestHtml,
  getDepartmentAcceptHtml,
} = require("../../emails/request.html");
const { ROLES } = require("../../constants/role.constants");
const {
  REQUEST_STATES,
} = require("../../constants/departmentRequest.constants");
const { createNotification } = require("../notification/notification.controller");
const { NOTIFICATION_CONTEXT, DONOT_DISTURB_STATE } = require("../../constants/notification.constants");

const createDepartmentRequest = async (req, res, next) => {
  try {
    const { department, notes } = req.body;
    const { data: departmentData } = await getDepartmentByIdOrCode(department);

    if (!departmentData) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Department not found",
      });
    }

    if (req.user.department) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `User is already in a department '${req?.user?.department?.code}'`,
      });
    }

    const alreadyExistingRequest = await models.departmentRequestModel.findOne({
      user: req.user.id,
      status: REQUEST_STATES.PENDING,
      department: departmentData._id,
    });

    if (alreadyExistingRequest) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message:
          "You have already requested to join this department. Please wait for approval.",
      });
    }

    let admins = await models.userModel.find({
      department: departmentData._id,
      role: "DEPARTMENT_ADMIN",
    });

    try {
      const superAdmin = await models.userModel.findOne({
        role: ROLES.SUPER_ADMIN,
      });

      if (superAdmin) {
        admins.push(superAdmin);
      }
    } catch (error) {

    }

    admins = admins.filter((admin) => {
      if (admin.donotDisturbState !== DONOT_DISTURB_STATE.DEFAULT && admin.notificationExpiry && new Date() < new Date(admin.notificationExpiry)) {
        return false;
      }
      return true;
    });

    await Promise.all(admins.map((user) => {

      return createNotification({
        user: user._id,
        message: `You have a new department request from ${req.user.username}`,
        context: NOTIFICATION_CONTEXT.DEPARTMENT_REQUEST,
        contextId: departmentData._id,
      })
    }));

    const adminEmails = admins.map((admin) => admin.email);

    const response = await sendEmail(
      adminEmails,
      [],
      [],
      "Department Approval Request",
      getDepartmentRequestHtml({
        requestorName: req.user.username,
        requestorEmail: req.user.email,
        departmentName: `${departmentData.code} - ${departmentData.name}`,
        requestorReason: notes,
        approveLink: `${process.env.FRONTEND_URL}/department`,
      })
    );

    const departmentRequest = await new models.departmentRequestModel({
      department: departmentData._id,
      user: req.user.id,
      notes,
    }).save();

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Department request created",
      data: departmentRequest,
    });
  } catch (error) {
    next(error);
  }
};

const getDepartmentRequests = async (req, res, next) => {
  try {
    let query = {};
    if (req.query.status) {
      query.status = {
        $regex: new RegExp(`^${req?.query?.status?.trim()}$`, "i"),
      };
    }
    const department = req.user.department;

    if (!req.user.department && req.user.role !== ROLES.SUPER_ADMIN) {
      query.user = req.user._id.toString();
    }

    if (department && req.user.role !== ROLES.SUPER_ADMIN) {
      query.department = department?._id;
    }

    const departmentRequests = await models.departmentRequestModel
      .find(query)
      .populate("department")
      .populate("user");

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Department requests retrieved",
      data: departmentRequests,
    });
  } catch (error) {
    next(error);
  }
};

const updateRequestStatus = async (req, res, next) => {
  try {
    const { departmentRequestId } = req.params;
    const departmentRequest = await models.departmentRequestModel
      .findById(departmentRequestId)
      .populate("department")
      .populate("user");
    if (!departmentRequest) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Department request not found",
      });
    }

    if (departmentRequest.status !== REQUEST_STATES.PENDING) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Request has already been processed",
      });
    }

    const { status } = req.body;
    if (!Object.values(REQUEST_STATES).includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Invalid status. Provide '${REQUEST_STATES.APPROVED}' or '${REQUEST_STATES.REJECTED}'`,
      });
    }

    const department = departmentRequest.department;
    const user = departmentRequest.user;

    if (
      req.user.role !== ROLES.SUPER_ADMIN &&
      !department.admins.map((d) => d.toString()).includes(req.user?.id)
    ) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You are not authorized to approve/reject this request",
      });
    }
    let updatedUser;
    if (status === REQUEST_STATES.APPROVED) {
      updatedUser = await models.userModel.findByIdAndUpdate(
        user.id,
        { department: department.id },
        { new: true }
      );
      const departmentUsers = await models.userModel.find({
        department: department._id,
      });
      await Promise.all(departmentUsers.map((user) => {
        if (user._id.toString() === updatedUser._id.toString()) {
          return;
        }
        return createNotification({
          user: user._id,
          message: `${updatedUser.username} has joined the department ${department.code} - ${department.name}`,
          context: NOTIFICATION_CONTEXT.DEPARTMENT_JOIN,
          contextId: updatedUser._id,
        })
      }));
      await sendEmail(
        [user.email],
        [],
        [],
        "Department Request Approved",
        getDepartmentAcceptHtml(user.username, department.code)
      );
    }

    const updatedDepartmentRequest =
      await models.departmentRequestModel.findByIdAndUpdate(
        departmentRequestId,
        { status },
        { new: true }
      );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Request status updated",
      data: {
        request: updatedDepartmentRequest,
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDepartmentRequest,
  updateRequestStatus,
  getDepartmentRequests,
};
