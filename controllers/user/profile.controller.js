const userModel = require("../../models/user.model");
const { StatusCodes } = require("http-status-codes");
const { getDepartmentByIdOrCode, addAdminToDepartment } = require("../department/department.controller");
const { ROLES } = require("../../constants/role.constants");
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

const updateProfile = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user._id);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "User not found",
            });
        }

        const { username, photo } = req.body;

        const updated = await userModel.findByIdAndUpdate(req.user._id, {
            username,
            photo,
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

        const { department, role } = req.body;

        const { data: departmentData } = await getDepartmentByIdOrCode(department);
        if (!departmentData) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Department not found",
            });
        }
        if (role === "DEPARTMENT_ADMIN") {
            req.params.departmentId = departmentData._id;
            req.params.userId = user._id;
            return addAdminToDepartment(req, res, next);
        }
        let updatedUser;
        if (role === "STAFF") {
            updatedUser = await userModel.findByIdAndUpdate(user._id, {
                department: departmentData._id,
                role,
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

module.exports = {
    getProfile,
    updateProfile,
    getAllUsers,
    updateUser,
    deleteUser,
};