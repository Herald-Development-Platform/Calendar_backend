const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const { StatusCodes } = require('http-status-codes');
const { ROLES } = require('../constants/role.constants');

const ACCESS_SECRET = process.env.JWT_SECRET;

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
        console.log(e)
        return res.status(StatusCodes.FORBIDDEN).json({ error: "Invalid Token!" });
    }
    if (!id) {
        return res.status(401).json({
            success: false,
            message: 'Invalid Token!',
        });
    }
    let user = await UserModel.findById(id);
    
    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: 'User not found!',
        });
    }
    req.user = user.toObject();
    return next();
};

const checkSuperAdmin = (req, res, next) => {
    if (req.user?.role !== ROLES.SUPER_ADMIN) {
        return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: 'User needs to be super admin.',
        });
    }
    return next();
};

const checkDepartmentAdmin = (req, res, next) => {
    if (req.user?.role !== ROLES.DEPARTMENT_ADMIN) {
        return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: 'User needs to be department admin.',
        });
    }
    return next();
};

const checkTeacher = (req, res, next) => {
    if (req.user?.role !== ROLES.TEACHER) {
        return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: 'User needs to be teacher.',
        });
    }
    return next();
};

module.exports = { verifyToken, checkSuperAdmin, checkDepartmentAdmin, checkTeacher};