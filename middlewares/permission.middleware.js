const { StatusCodes } = require("http-status-codes");
const { ROLES } = require("../constants/role.constants");

const checkPermissions = (permissionsToCheck) => (req, res, next) => {
    try {
        const { user } = req;
        if (!user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Not logged in! Please login to access the system.",
            });
        }

        if (user?.role === ROLES.SUPER_ADMIN){
            return next();
        }

        for (let permission of permissionsToCheck) {
            if (!user.permissions.includes(permission)) {
                return res.status(StatusCodes.FORBIDDEN).json({
                    success: false,
                    message: `The permission ${permission} is required to access this route`,
                });
            }
        }
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    checkPermissions,
}