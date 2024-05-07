const jwt = require('jsonwebtoken');
const { UserModel } = require('../models/database.models');
const { StatusCodes } = require('http-status-codes');


const ACCESS_SECRET = process.env.ACCESS_SECRET;

const verifyToken = async (req, res, next) => {
    let token = req.get('authorization');
    if (!token) {
        return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: 'Authentication Token Not Provided!',
        });
    }
    let id;
    token = token.split(' ')[1];
    try {
        const { id: userID } = jwt.verify(token, ACCESS_SECRET);
        id = userID?.trim();
    } catch (e) {
        return res.status(StatusCodes.FORBIDDEN).json({ error: "Invalid Token!" });
    }
    if (!id) {
        return res.status(401).json({
            success: false,
            message: 'Invalid Token!',
        });
    }
    let user;
    if (id === '1'){
        user = await UserModel.findOne({ role: 'Admin' });
    } else {
        user = await UserModel.findById(id);
    }
    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: 'User not found!',
        });
    }
    req.user = user.toObject();
    return next();
};

const checkAdmin = (req, res, next) => {
    if (req.user?.role?.toLowerCase()?.trim() !== 'admin') {
        return res.status(StatusCodes.FORBIDDEN).json({
            message: 'User needs to be admin.',
        });
    }
    return next();
};

module.exports = { verifyToken, checkAdmin };