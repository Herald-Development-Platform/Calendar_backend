const departmentRouter = require("express").Router();

const { checkPermissions } = require("../middlewares/permission.middleware");

const { PERMISSIONS } = require("../constants/permissions.constants");
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  addAdminToDepartment,
  removeAdminFromDepartment,
} = require("../controllers/department/department.controller");

const { verifyToken, checkSuperAdmin } = require("../middlewares/auth.middleware");

const {
  createDepartmentRequest,
  getDepartmentRequests,
  updateRequestStatus,
} = require("../controllers/department/request.controller");
const { saveUploadedDepartments } = require("../controllers/import/departmentImport.controller");
const { excelUpload } = require("../config/multer.config");

departmentRouter.post("/department/request", verifyToken, createDepartmentRequest);
departmentRouter.get(
  "/department/request",
  verifyToken,
  checkPermissions(PERMISSIONS.MANAGE_DEPARTMENT_REQUEST),
  getDepartmentRequests
);
departmentRouter.get("/department/request/my", verifyToken, getDepartmentRequests);
departmentRouter.put(
  "/department/request/:departmentRequestId",
  verifyToken,
  checkPermissions(PERMISSIONS.MANAGE_DEPARTMENT_REQUEST),
  updateRequestStatus
);

departmentRouter.get("/department", verifyToken, getDepartments);

departmentRouter.post(
  "/department/upload",
  verifyToken,
  checkPermissions(PERMISSIONS.CREATE_DEPARTMENT),
  excelUpload,
  saveUploadedDepartments
);

departmentRouter.post(
  "/department",
  verifyToken,
  checkPermissions(PERMISSIONS.CREATE_DEPARTMENT),
  createDepartment
);

departmentRouter.put(
  "/department/:departmentId",
  verifyToken,
  checkPermissions(PERMISSIONS.UPDATE_DEPARTMENT),
  updateDepartment
);

departmentRouter.delete(
  "/department/:departmentId",
  verifyToken,
  checkPermissions(PERMISSIONS.DELETE_DEPARTMENT),
  deleteDepartment
);

departmentRouter.patch(
  "/department/:departmentId/add-admin/:userId",
  verifyToken,
  checkPermissions([PERMISSIONS.UPDATE_USER]),
  addAdminToDepartment
);

departmentRouter.patch(
  "/department/:departmentId/remove-admin/:userId",
  verifyToken,
  checkPermissions([PERMISSIONS.UPDATE_USER]),
  removeAdminFromDepartment
);

module.exports = departmentRouter;
