const departmentRouter = require('express').Router();

const {
    checkPermissions
} = require("../middlewares/permission.middleware");

const {
    PERMISSIONS
} = require("../constants/permissions.constants");

departmentRouter.get(
    "/"
);

departmentRouter.post(
    "/"
);

departmentRouter.put(
    "/:departmentId"
);

departmentRouter.delete(
    "/:departmentId"
);

departmentRouter.patch(
    "/:departmentId/add-admin/:adminId"
);

departmentRouter.patch(
    "/:departmentId/remove-admin/:adminId"
);



module.exports = departmentRouter;