const userRouter = require("express").Router();

const {
    updateProfile,
    getProfile,
} = require("../controllers/user/profile.controller");

const {
    checkPermissions
} = require("../middlewares/permission.middleware");
const {
    PERMISSIONS
} = require("../constants/permissions.constants");
const { verifyOTP } = require("../controllers/auth/user.auth.controller");


// Profile endpoints
userRouter.patch("/profile", updateProfile);
userRouter.get("/profile", getProfile);

userRouter.get("/verifyOTP", verifyOTP);

module.exports = userRouter;