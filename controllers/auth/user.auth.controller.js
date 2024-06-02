const { StatusCodes } = require("http-status-codes");
const models = require("../../models/index.model");
const bcrypt = require("bcrypt");
const {
    generateToken,
} = require("../../services/auth.services");
const { ROLES } = require("../../constants/role.constants");
const { getRegistrationHTML } = require("../../emails/registration.html");

const { COLLEGEID_REGEX, TEACHER_EMAIL_REGEX } = require("../../constants/regex.constants");
const { sendEmail } = require("../../services/email.services");
const { generateOTP } = require("../../services/otp.services");

const userRegister = async (req, res, next) => {
    try {
        const {
            email,
            password,
            username,
            photo,
        } = req.body;

        const alreadyExisting = await models.userModel.findOne({ email: email });
        if (alreadyExisting) {
            return res.status(StatusCodes.CONFLICT).json({
                success: false,
                message: "User already exists",
            });
        }

        if (COLLEGEID_REGEX.test(email)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Students dont have access to this system. Please contact admin for more details.",
            });
        }

        if (!TEACHER_EMAIL_REGEX.test(email)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid herald college email. Please enter a valid email.",
            });
        }

        let role = ROLES.STAFF;
        if (email === process.env.ADMIN_EMAIL) {
            role = ROLES.SUPER_ADMIN;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const OTP = generateOTP();
        const expiryDate = Date.now() + 5 * 60 * 1000;
        const newuser = await new models.userModel({
            email,
            password: hashedPassword,
            username,
            photo,
            role,
            OTP,
            otpExpiryDate: expiryDate,
            emailVerified: false,
        }).save();

        const response = await sendEmail(email, [], [], "Welcome to Herald Intra Calendar", getRegistrationHTML(username, OTP));
        
        if (!response.success) {
            await models.userModel.findByIdAndDelete(newuser._id);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: "Error sending email",
                data: response.error,
            });
        }
        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "user created successfully",
            data: newuser,
        });
    } catch (error) {
        next(error);
    }
}

const userLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await models.userModel.findOne({ email: email });
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "User not found",
            });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        console.log({...user});

        const token = generateToken(user.toOjbect());
        res.cookie('token', token, { domain: process.env.FRONTEND_URL });
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "user logged in successfully",
            data: token,
        });
    } catch (error) {
        next(error);
    }
}


module.exports = {
    userRegister,
    userLogin,
}