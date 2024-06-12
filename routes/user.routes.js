const userRouter = require("express").Router();

const {
    updateProfile,
    getProfile,
    getAllUsers,
    updateUser,
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

const { verifyOTP } = require("../controllers/auth/user.auth.controller");


// Profile endpoints
userRouter.get("/profile/all", verifyToken, checkSuperAdmin, getAllUsers);
userRouter.patch("/profile", updateProfile);
userRouter.get("/profile",verifyToken, getProfile);

userRouter.put("/user/:id", verifyToken, checkSuperAdmin, updateUser);

userRouter.get("/verifyOTP", verifyOTP);

module.exports = userRouter;