const { StatusCodes } = require("http-status-codes");
const userModel = require("../../models/user.model");
const bcrypt = require("bcrypt");
const {
    generateToken,
} = require("../../services/auth.services");
const { ROLES } = require("../../constants/role.constants");
const { DEPARTMENTS } = require("../../constants/departments.constants");

const adminRegister = async (req, res, next) => {
    try {
        const {
            email,
            password,
            username,
            photo,
        } = req.body;

        const alreadyExistingAdmin = await userModel.findOne({ role: ROLES.SUPER_ADMIN });
        if (alreadyExistingAdmin) {
            return res.status(StatusCodes.CONFLICT).json({
                success: false,
                message: "Admin already exists",
            });
        }

        const alreadyExistingUser = await userModel.findOne({ email: email });
        if (alreadyExistingUser) {
            return res.status(StatusCodes.CONFLICT).json({
                success: false,
                message: "User with this email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newadmin = await new userModel({
            email,
            password: hashedPassword,
            username,
            photo,
            role: ROLES.SUPER_ADMIN,
            department: DEPARTMENTS.ADMIN,
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
        const admin = await userModel.findOne({ email: email });
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

        const token = generateToken({ id: admin._id });

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