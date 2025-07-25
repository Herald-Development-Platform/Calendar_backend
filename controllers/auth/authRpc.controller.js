const ACCESS_SECRET = process.env.JWT_SECRET;
const jwt = require("jsonwebtoken");
const UserModel = require("../../models/user.model");
const { ROLES } = require("../../constants/role.constants");
const DepartmentModel = require("../../models/department.model");
const { StatusCodes } = require("http-status-codes");

const authenticateUserToken = async (req, res, next) => {
  let token = req.body.token;
  if (!token) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: "Authentication Token Not Provided!",
    });
  }
  let id;
  token = token.trim();
  try {
    const { id: userID } = jwt.verify(token, ACCESS_SECRET);
    id = userID?.trim();
  } catch (e) {
    return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Invalid Token!" });
  }
  if (!id) {
    return res.status(401).json({
      success: false,
      message: "Invalid Token!",
    });
  }
  let user = await UserModel.findById(id).populate("department");

  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Authenticated user account not found!",
    });
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Authenticated!",
    user,
  });
};

module.exports = {
  authenticateUserToken,
};
