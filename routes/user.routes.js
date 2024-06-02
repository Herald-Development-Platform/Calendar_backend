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


// Profile endpoints
userRouter.patch("/profile", updateProfile);
userRouter.get("/profile", getProfile);

module.exports = userRouter;