const userRouter = require("express").Router();

const {
    updateProfile,
    getProfile,
} = require("../controllers/user/profile.controller");


// Profile endpoints
userRouter.patch("/profile", updateProfile);
userRouter.get("/profile", getProfile);

module.exports = userRouter;