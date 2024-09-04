const semesterRoutes = require("express").Router();
const { excelUpload } = require("../config/multer.config");
const { PERMISSIONS } = require("../constants/permissions.constants");
const { saveUploadedSemesters } = require("../controllers/import/semesterImport.controller");
const SemesterController = require("../controllers/semesters/semester.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { checkPermissions } = require("../middlewares/permission.middleware");

semesterRoutes.post(
    "/semester",
    verifyToken,
    checkPermissions([PERMISSIONS.CREATE_SEMESTER]),
    SemesterController.createSemester
);

semesterRoutes.post(
    "/semester/upload",
    verifyToken,
    checkPermissions([PERMISSIONS.CREATE_SEMESTER]),
    excelUpload,
    saveUploadedSemesters,
);

semesterRoutes.get(
    "/semester",
    verifyToken,
    SemesterController.getAllSemester
);

semesterRoutes.put(
    "/semester/:id",
    verifyToken,
    checkPermissions([PERMISSIONS.UPDATE_SEMESTER]),
    SemesterController.updateSemester
);

semesterRoutes.delete(
    "/semester/:id",
    verifyToken,
    checkPermissions([PERMISSIONS.DELETE_SEMESTER]),
    SemesterController.deleteSemester
);

module.exports = semesterRoutes;
