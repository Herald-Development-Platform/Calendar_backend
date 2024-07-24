const userRouter = require("express").Router();

const {
    updateProfile,
    getProfile,
    getAllUsers,
    updateUser,
    deleteUser,
    updateUserPermissions,
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
const { uploadUsers } = require("../controllers/user/import.controller");
const { teacherUpload } = require("../config/multer.config");


// Profile endpoints
userRouter.delete("/profile/:id",verifyToken, checkPermissions(PERMISSIONS.DELETE_USER), deleteUser);
userRouter.get("/profile/all", verifyToken, getAllUsers);
userRouter.patch("/profile", verifyToken, updateProfile);
userRouter.get("/profile",verifyToken, getProfile);

userRouter.post("/user/addUsers", verifyToken, checkPermissions(PERMISSIONS.CREATE_USER), teacherUpload, uploadUsers);
userRouter.put("/user/:id", verifyToken, checkPermissions(PERMISSIONS.UPDATE_USER) , updateUser);
userRouter.patch("/user/:id", verifyToken, checkSuperAdmin, updateUserPermissions);

userRouter.get("/verifyOTP", verifyOTP);
userRouter.get("/verifyOTPFromEmail", verifyOTPFromEmail);


module.exports = userRouter;