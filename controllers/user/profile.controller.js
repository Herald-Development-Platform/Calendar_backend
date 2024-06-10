const userModel = require("../../models/user.model");
const { StatusCodes } = require("http-status-codes");
const getProfile = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user._id);
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
        const users = await userModel.find({}).populate("department");
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Users fetched successfully",
            data: users,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getProfile,
    updateProfile,
    getAllUsers,
};