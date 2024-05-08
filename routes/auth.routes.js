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


// Admin auth
authRouter.post("/admin/register", adminRegister);
authRouter.post("/admin/login", adminLogin);

// User auth
authRouter.post("/register", userRegister);
authRouter.post("/login", userLogin);

module.exports = authRouter;