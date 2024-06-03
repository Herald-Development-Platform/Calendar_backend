const departmentRouter = require('express').Router();

const {
    checkPermissions
} = require("../middlewares/permission.middleware");

const {
    PERMISSIONS
} = require("../constants/permissions.constants");
const { getDepartments, createDepartment, updateDepartment, deleteDepartment, addAdminToDepartment, removeAdminFromDepartment } = require('../controllers/department/department.controller');
const { verifyToken, checkSuperAdmin } = require('../middlewares/auth.middleware');

departmentRouter.get(
    "/department",
    getDepartments
);

departmentRouter.post(
    "/department",
    verifyToken,
    checkSuperAdmin,
    createDepartment,
);

departmentRouter.put(
    "/department/:departmentId",
    verifyToken,
    updateDepartment,
);

departmentRouter.delete(
    "/department/:departmentId",
    verifyToken,
    deleteDepartment,
);

departmentRouter.patch(
    "/department/:departmentId/add-admin/:userId",
    verifyToken,
    addAdminToDepartment,
);

departmentRouter.patch(
    "/department/:departmentId/remove-admin/:userId",
    verifyToken,
    removeAdminFromDepartment,
);

module.exports = departmentRouter;