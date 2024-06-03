const authRouter = require("express").Router();

// Importing Controllers
const {
    userRegister,
    userLogin,
} = require("../controllers/auth/user.auth.controller");

const {
    adminRegister,
    adminLogin,
} = require("../controllers/auth/admin.auth.controller");
const { getAuthUrl, handleGoogleCallback } = require("../controllers/auth/google.auth.controller");
const { auth } = require("google-auth-library");


// Admin auth
authRouter.post("/admin/login", adminLogin);

// User auth
authRouter.post("/register", userRegister);
authRouter.post("/login", userLogin);

authRouter.get("/googleAuth", getAuthUrl);
authRouter.get("/googleAuth/callback", handleGoogleCallback);

module.exports = authRouter;