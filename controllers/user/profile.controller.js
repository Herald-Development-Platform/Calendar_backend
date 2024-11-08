const userModel = require("../../models/user.model");
const { StatusCodes } = require("http-status-codes");
const { getDepartmentByIdOrCode, addAdminToDepartment } = require("../department/department.controller");
const { ROLES } = require("../../constants/role.constants");
const { DEFAULT_PERMISSIONS } = require("../../constants/permissions.constants");
const { getImportRegistrationHTML } = require("../../emails/registration.html");
const { sendEmail } = require("../../services/email.services");
const { generateRandomString } = require("../../utils/string.utils");
const bcrypt = require("bcrypt");


const getProfile = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user._id).populate("department");
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Profile fetched successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
}

const createUser = async (req, res, next) => {
    try {
        let {
            username,
            email,
            photo,
            role,
            department,
        } = req.body;

        role = role ? role?.toString().toUpperCase().trim() : ROLES.STAFF;

        if (Object.values(ROLES).indexOf(role) === -1) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Validation Error, Invalid role",
                data: [
                    {
                        path: "role",
                        message: `Invalid role, valid values : ${Object.values(ROLES).join(", ")}`,
                    }
                ]
            });
        }

        let emailVerified = true;
        let permissions = DEFAULT_PERMISSIONS[`${role}_PERMISSIONS`];

        if (role !== ROLES.SUPER_ADMIN && department?.toString() !== req.user?.department?._id?.toString()) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "You are not authorized to create a user in other department",
            });
        }

        const departmentData = await getDepartmentByIdOrCode(department);

        if (!departmentData.success) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Department not found",
            });
        }

        const alreadyExistingUser = await userModel.findOne({
            email: { $regex: new RegExp(email, "i") }
        });

        if (alreadyExistingUser) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "User already exists with email!",
            });
        }

        const randomPassword = generateRandomString(8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const newUser = new userModel({
            email,
            emailVerified,
            username,
            password: hashedPassword,
            photo,
            role,
            department: departmentData?.data?._id,
            permissions,
        }).save();

        const emailResponse = await sendEmail(email, [], [], "Welcome to Herald Intra Calendar" ,getImportRegistrationHTML(username, email, randomPassword));

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "User created successfully",
            data: newUser,
        });

    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user._id);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "User not found",
            });
        }

        const {
            username,
            photo,
            importantDates,
            syncWithGoogle,
            donotDisturbState,
            notificationExpiry,
            activeSemester,
        } = req.body;

        if (syncWithGoogle && !(Boolean(user?.googleTokens?.tokenHash))) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Please login with google to sync your calendar",
            });
        }

        const updated = await userModel.findByIdAndUpdate(req.user._id, {
            username,
            photo,
            importantDates,
            syncWithGoogle,
            donotDisturbState,
            notificationExpiry,
            activeSemester,
        }, { new: true });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Profile updated successfully",
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
}

const getAllUsers = async (req, res, next) => {
    try {
        let users;
        if (req.user.role === ROLES.SUPER_ADMIN) {
            users = await userModel.find({}).populate("department");
        } else if (req.user.department) {
            users = await userModel.find({ department: req.user.department }).populate("department");
        } else {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized to access this resource",
            });
        }
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Users fetched successfully",
            data: users,
        });
    } catch (error) {
        next(error);
    }
}

const updateUser = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.params.id);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "User not found",
            });
        }

        const { department, role, permissions } = req.body;

        if (req.user.role !== ROLES.SUPER_ADMIN && req.user.department._id.toString() !== user.department.toString() ) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: "Unauthorized to update this user",
            });
        }

        if (req.user.role !== ROLES.SUPER_ADMIN && department !== user.department.toString() ) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: "Unauthorized to update this user's department",
            });
        }

        const { data: departmentData } = await getDepartmentByIdOrCode(department);
        if (!departmentData) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Department not found",
            });
        }
        if (role === ROLES.DEPARTMENT_ADMIN && user.role !== ROLES.DEPARTMENT_ADMIN) {
            req.params.departmentId = departmentData._id;
            req.params.userId = user._id;
            return addAdminToDepartment(req, res, next);
        }
        let updatedUser;
        if (role === ROLES.DEPARTMENT_ADMIN && user.role === ROLES.DEPARTMENT_ADMIN) {
            updatedUser = await userModel.findByIdAndUpdate(user._id, {
                permissions
            }, { new: true }
            );
        }
        if (role === ROLES.STAFF) {
            updatedUser = await userModel.findByIdAndUpdate(user._id, {
                department: departmentData._id,
                role,
                permissions
            }, { new: true }
            );
        }
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "User updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        next(error);
    }
}

const deleteUser = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.params.id);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "User not found",
            });
        }
        if (req.user.role === ROLES.STAFF) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized to delete this user",
            });
        }
        if (req.user.role !== ROLES.SUPER_ADMIN && req.user.role === ROLES.DEPARTMENT_ADMIN && user.department.toString() !== req.user?.department?._id?.toString()) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized to delete this user",
            });
        }
        const deleted = await userModel.findByIdAndDelete(user._id);
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "User deleted successfully",
            data: deleted,
        });
    }
    catch (error) {
        next(error);
    }
}

const updateUserPermissions = async (req, res, next) => {
    const { id } = req.params;
    try {
        const permissions = req.body.permissions;

        const user = await userModel.findById(id);

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "User not found",
            });
        }

        const updatedUser = await userModel.findByIdAndUpdate(user._id, {
            permissions: Array.from(new Set(permissions)),
        }, { new: true });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Permissions update successfully",
            data: updatedUser,
        });
    } catch (error) {
        
    }
}

module.exports = {
    getProfile,
    updateProfile,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    updateUserPermissions,
};