const { StatusCodes } = require("http-status-codes");
const { ROLES } = require("../constants/role.constants");

const checkPermissions = permissionsToCheck => (req, res, next) => {
  if (typeof permissionsToCheck === "string") permissionsToCheck = [permissionsToCheck];
  try {
    const { user } = req;
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Not logged in! Please login to access the system.",
      });
    }

    if (user?.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    const missingPermissions = [];

    for (let permission of permissionsToCheck) {
      if (!user.permissions.includes(permission)) {
        missingPermissions.push(permission);
      }
    }

    if (missingPermissions.length > 0) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `Permissions ${missingPermissions.join(", ")} are missing!`,
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkPermissions,
};
