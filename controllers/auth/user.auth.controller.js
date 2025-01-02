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
const { getForgetPasswordHTML } = require("../../emails/password.html");

if (!process.env.SUPER_ADMIN_EMAILS) {
    throw new Error("SUPER_ADMIN_EMAILS is not defined in .env file");
}

const SUPER_ADMIN_EMAILS = process.env.SUPER_ADMIN_EMAILS?.toLowerCase().split(",") ?? "";


const userRegister = async (req, res, next) => {
    try {
        const {
            email,
            password,
            username,
            photo,
        } = req.body;

        const alreadyExisting = await models.userModel.findOne({ email: email });
        if (alreadyExisting && alreadyExisting?.emailVerified) {
            return res.status(StatusCodes.CONFLICT).json({
                success: false,
                message: "User already exists",
            });
        } else {
            await models.userModel.findByIdAndDelete(alreadyExisting?._id);
        }
        if (!process.env.ALLOW_INVALID_EMAILS) {
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
        }

        let role = ROLES.STAFF;
        if (SUPER_ADMIN_EMAILS.includes(email)) {
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

        const response = await sendEmail(email, [], [], "Welcome to Herald Intra Calendar", getRegistrationHTML(username, OTP, email));

        if (!response.success) {
            await models.userModel.findByIdAndDelete(newuser?._id);
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
        let user = await models.userModel.find({ email: email });
        if (!user || user.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "User not found",
            });
        }
        user = user[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        if (!user.emailVerified) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Email not verified",
            });
        }
        user = JSON.parse(JSON.stringify(user));
        user.id = user._id.toString();
        const token = generateToken(user);
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

const verifyOTP = async (req, res, next) => {
    try {
        const { email, OTP } = req.query;
        const user = await models.userModel.findOne({
            email,
            OTP,
        });
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Invalid OTP",
            });
        }
        if (user.otpExpiryDate < Date.now()) {
            await models.userModel.findByIdAndDelete(user._id);
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "OTP expired",
            });
        }
        user.OTP = null;
        user.otpExpiryDate = null;
        user.emailVerified = true;
        await user.save();
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "OTP verified successfully",
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
}

const verifyOTPFromEmail = async (req, res, next) => {
    try {
        const { email, OTP } = req.query;
        const user = await models.userModel.findOne({
            email,
            OTP,
        });
        if (!user) {
            return res.send(`
                <h1>Invalid OTP</h1>
                <script>
                    setTimeout(()=>{
                        window.location.href = "${process.env.FRONTEND_URL}/login";    
                    },2000);
                </script>
            `)
        }
        if (user.otpExpiryDate < Date.now()) {
            await models.userModel.findByIdAndDelete(user._id);
            return res.send(`
                <h1>OTP Expired</h1>
                <script>
                    setTimeout(()=>{
                        window.location.href = "${process.env.FRONTEND_URL}/login";    
                    },2000);
                </script>
            `)
        }
        user.OTP = null;
        user.otpExpiryDate = null;
        user.emailVerified = true;
        await user.save();
        return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
    catch (error) {
        return res.send(`
            <h1>Error verifying OTP</h1>
            <script>
                setTimeout(()=>{
                    window.location.href = "${process.env.FRONTEND_URL}/login";    
                },2000);
            </script>
        `)
    }
}

const generateNewToken = async (req, res, next) => {
    try {
        let user = req.user;
        user.department = user.department?._id?.toString();
        const token = generateToken(user);
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

const forgetPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        let user = await models.userModel.findOne({ email });
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "User not found",
            });
        }
        const OTP = generateOTP().toString();
        const expiryDate = new Date(Date.now() + 5 * 60 * 1000);
        const updatedUser = await models.userModel.findByIdAndUpdate(user._id, {
            OTP,
            otpExpiryDate: expiryDate,
        }, { new: true });

        console.log("OTP: ", OTP);
        console.log("Updated User: ", updatedUser);
        const response = await sendEmail(email, [], [], "Password Reset", getForgetPasswordHTML(user.username, OTP));
        if (!response.success) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: "Error sending email",
                data: response.error,
            });
        }
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Forget Password PIN sent successfully.",
            data: email,
        });
    }
    catch (error) {
        next(error);
    }
}

const validateResetPassword = async (req, res, next) => {
    try {
        const { email, OTP } = req.query;
        let user = await models.userModel.findOne({ email, OTP });
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Invalid PIN",
            });
        }
        if (user.otpExpiryDate < Date.now()) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "PIN expired",
            });
        }
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "PIN verified successfully",
        });
    }
    catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { email, OTP, password } = req.body;
        let user = await models.userModel.findOne({ email, OTP });
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Invalid PIN",
            });
        }
        if (user.otpExpiryDate < Date.now()) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "PIN expired",
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.OTP = null;
        user.otpExpiryDate = null;
        await user.save();
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Password reset successfully",
        });
    }
    catch (error) {
        next(error);
    }
}

const changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        let user = req.user;
        user = await models.userModel.findById(user.id);
        if (user.password) {
            const passwordMatch = await bcrypt.compare(oldPassword, user.password);
            if (!passwordMatch) {
                return res.status(StatusCodes.FORBIDDEN).json({
                    success: false,
                    message: "Current password incorrect!",
                });
            }
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Password changed successfully",
        });
    }
    catch (error) {
        next(error);
    }
}


module.exports = {
    userRegister,
    userLogin,
    verifyOTP,
    verifyOTPFromEmail,
    generateNewToken,
    forgetPassword,
    validateResetPassword,
    resetPassword,
    changePassword,
}