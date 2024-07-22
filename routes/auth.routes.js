const authRouter = require("express").Router();

// Importing Controllers
const {
    userRegister,
    userLogin,
    generateNewToken,
    forgetPassword,
    resetPassword,
    changePassword,
    validateResetPassword,
} = require("../controllers/auth/user.auth.controller");

const {
    adminRegister,
    adminLogin,
} = require("../controllers/auth/admin.auth.controller");
const { getAuthUrl, handleGoogleCallback } = require("../controllers/auth/google.auth.controller");
const { auth } = require("google-auth-library");
const { verifyToken } = require("../middlewares/auth.middleware");


// Admin auth
authRouter.post("/admin/login", adminLogin);
authRouter.post("/admin/register", adminRegister);

// User auth
authRouter.post("/register", userRegister);
authRouter.post("/login", userLogin);

authRouter.get("/generateNewToken", verifyToken, generateNewToken);

authRouter.get("/googleAuth", getAuthUrl);
authRouter.get("/googleAuth/callback", handleGoogleCallback);

//Password
authRouter.post("/forgetPassword", forgetPassword);
authRouter.post("/validateResetPasswordOTP", validateResetPassword);
authRouter.post("/resetPassword", resetPassword);
authRouter.post("/changePassword", verifyToken, changePassword);

module.exports = authRouter;