const { StatusCodes } = require("http-status-codes");
const models = require("../../models/index.model");
const bcrypt = require("bcrypt");
const {
    generateToken,
} = require("../../services/auth.services");
const {
    ROLES
} = require("../../constants/role.constants");

if (!process.env.SUPER_ADMIN_EMAILS) {
    throw new Error("SUPER_ADMIN_EMAILS is not defined in .env file");
}

const SUPER_ADMIN_EMAILS = process.env.SUPER_ADMIN_EMAILS?.toLowerCase().split(",") ?? "";

const adminRegister = async (req, res, next) => {
    try {
        const {
            email,
            password,
            username,
            photo,
        } = req.body;

        const alreadyExistingAdmin = await models.userModel.findOne({ role: ROLES.SUPER_ADMIN });
        if (alreadyExistingAdmin) {
            await models.userModel.deleteMany(alreadyExistingAdmin._id);
        }

        if (SUPER_ADMIN_EMAILS && !SUPER_ADMIN_EMAILS?.includes(email)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Super admin email configuration failed.",
            });
        }
        await models.userModel.deleteMany({ email });

        const alreadyExistingUser = await models.userModel.findOne({ email: email });
        if (alreadyExistingUser) {
            return res.status(StatusCodes.CONFLICT).json({
                success: false,
                message: "User with this email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newadmin = await new models.userModel({
            email,
            password: hashedPassword,
            username,
            photo,
            role: ROLES.SUPER_ADMIN,
            OTP: null,
            emailVerified: true,
            otpExpiryDate: null,
        }).save();

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Admin created successfully",
            data: newadmin,
        });
    } catch (error) {
        next(error);
    }
}


const adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        let admin = await models.userModel.findOne({ email: email });
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
        admin = JSON.parse(JSON.stringify(admin));
        admin.id = admin._id.toString();

        const token = generateToken(admin);
        res.cookie('token', token, { domain: process.env.FRONTEND_URL });
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
    adminRegister,
    adminLogin,
}