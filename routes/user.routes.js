const userRouter = require("express").Router();

// User endpoints
userRouter.patch("/profile", updateProfile);
userRouter.get("/profile", getProfile);

module.exports = userRouter;