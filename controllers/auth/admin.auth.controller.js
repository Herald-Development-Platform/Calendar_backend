const { StatusCodes } = require("http-status-codes");
const models = require("../../models/index.model");
const bcrypt = require("bcrypt");
const {
    generateToken,
} = require("../../services/auth.services");
const {
    ROLES
} = require("../../constants/role.constants");

const createAdmin = async () => {
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
    const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;

    try {
        const alreadyExistingAdmin = await userModel.findOne({ role: ROLES.SUPER_ADMIN });
        if (alreadyExistingAdmin) {
            return;
        }

        const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

        await new models.userModel({
            email: SUPER_ADMIN_EMAIL,
            password: hashedPassword,
            username: "superadmin",
            role: ROLES.SUPER_ADMIN,
        }).save();
    } catch (error) {
        console.log(error);
    }
}

const adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const admin = await models.userModel.findOne({ email: email });
        if (!admin) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "admin not found",
            });
        }
        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const token = generateToken(admin.toObject());
        res.cookie('token',     token, { domain: process.env.FRONTEND_URL });
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "admin logged in successfully",
            data: token,
        });
    } catch (error) {
        next(error);
    }
}


module.exports = {
    createAdmin,
    adminLogin,
}