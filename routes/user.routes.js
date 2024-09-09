const userRouter = require("express").Router();

const {
    updateProfile,
    getProfile,
    getAllUsers,
    updateUser,
    deleteUser,
    updateUserPermissions,
    createUser,
} = require("../controllers/user/profile.controller");

const {
    checkPermissions
} = require("../middlewares/permission.middleware");

const {
    verifyToken,
    checkDepartmentAdmin,
    checkSuperAdmin,
} = require("../middlewares/auth.middleware");

const {
    PERMISSIONS
} = require("../constants/permissions.constants");

const { verifyOTP, verifyOTPFromEmail } = require("../controllers/auth/user.auth.controller");
const { uploadUsers, saveUploadedUsers, getUserUploadReport } = require("../controllers/user/import.controller");
const { excelUpload } = require("../config/multer.config");


// Profile endpoints
userRouter.delete("/profile/:id", verifyToken, checkPermissions(PERMISSIONS.DELETE_USER), deleteUser);
userRouter.get("/profile/all", verifyToken, getAllUsers);
userRouter.patch("/profile", verifyToken, updateProfile);
userRouter.get("/profile", verifyToken, getProfile);

userRouter.post(
    "/user",
    verifyToken,
    checkPermissions(PERMISSIONS.CREATE_USER),
    createUser,
)
userRouter.post("/user/addUsers", verifyToken, checkPermissions(PERMISSIONS.CREATE_USER), excelUpload, saveUploadedUsers);
userRouter.get("/userUploadReport/:filename", verifyToken, checkPermissions(PERMISSIONS.CREATE_USER), getUserUploadReport);


userRouter.put("/user/:id", verifyToken, checkPermissions(PERMISSIONS.UPDATE_USER), updateUser);
userRouter.patch("/user/:id", verifyToken, checkSuperAdmin, updateUserPermissions);

userRouter.get("/verifyOTP", verifyOTP);
userRouter.get("/verifyOTPFromEmail", verifyOTPFromEmail);


module.exports = userRouter;