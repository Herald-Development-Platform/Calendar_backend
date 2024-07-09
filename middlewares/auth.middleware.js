const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const { StatusCodes } = require('http-status-codes');
const { ROLES } = require('../constants/role.constants');
const { decrypt } = require("../services/encryption.services");
const { google } = require("googleapis");

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
    token = token.trim();
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
    let user = await UserModel.findById(id).populate('department');

    if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: 'Authenticated user account not found!',
        });
    }
    req.user = user.toObject();
    req.user.id = req.user._id.toString();
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
    if (req.user?.role !== ROLES.STAFF) {
        return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: 'User needs to be staff.',
        });
    }
    return next();
};

const isGoogleAuthorized = async (req, res, next) => {
    const userAgain = await UserModel.findById(req.user.id);
    req.user.googleTokens = userAgain.googleTokens;
    console.log(req.user);
    if (!req.user?.googleTokens) {
        return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: 'User needs to be authorized with google.',
        });
    }

    const { googleTokens } = req.user;

    if (!googleTokens || Object.keys(googleTokens).length === 0){
        return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: 'User needs to be authorized with google.',
        });
    }

    const decryptedTokens = JSON.parse(decrypt(googleTokens.iv, googleTokens.tokenHash));

    let authClient = new google.auth.OAuth2(
        process.env.GOOGLE_ID,
        process.env.GOOGLE_SECRET,
        `${process.env.BACKEND_BASE_URL}/api/googleAuth/callback`
    );

    authClient.setCredentials(decryptedTokens);
    req.googleAuthClient = authClient;

    return next();
};

module.exports = {
    verifyToken,
    checkSuperAdmin,
    checkDepartmentAdmin,
    checkTeacher,
    isGoogleAuthorized,
};