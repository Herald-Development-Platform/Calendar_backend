const { StatusCodes } = require("http-status-codes");
const models = require("../../models/index.model");
const bcrypt = require("bcrypt");
const {
    generateToken,
} = require("../../services/auth.services");
const { ROLES } = require("../../constants/role.constants");

const { COLLEGEID_REGEX, TEACHER_EMAIL_REGEX } = require("../../constants/regex.constants");



const userRegister = async (req, res, next) => {
    try {
        const {
            email,
            password,
            username,
            photo,
            role,
            department,
        } = req.body;

        const alreadyExisting = await models.userModel.findOne({ email: email });
        if (alreadyExisting) {
            return res.status(StatusCodes.CONFLICT).json({
                success: false,
                message: "User already exists",
            });
        }

        if (!ROLES[role]) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid role. Valid roles are " + Object.values(ROLES).join(", "),
            });
        }

        if (role === ROLES.SUPER_ADMIN) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "You are not authorized to create super admin",
            });
        }

        if (department) {
            let department = await models.departmentModel.findById(department);
            if (!department) {
                department = await models.departmentModel.findOne({
                    $or: [
                        { name: department },
                        { code: department }
                    ]
                });
                if (!department) {
                    return res.status(StatusCodes.BAD_REQUEST).json({
                        success: false,
                        message: "Invalid department id",
                    });
                }
            }
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

        const hashedPassword = await bcrypt.hash(password, 10);

        const newuser = await new userModel({
            email,
            password: hashedPassword,
            username,
            photo,
            role,
            department,
        }).save();

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
        const user = await userModel.findOne({ email: email });
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


module.exports = {
    userRegister,
    userLogin,
}