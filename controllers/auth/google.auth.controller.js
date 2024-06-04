
const { OAuth2Client } = require('google-auth-library');
const { StatusCodes } = require('http-status-codes');
const axios = require('axios');
const {
    generateToken,
} = require("../../services/auth.services");

const models = require('../../models/index.model');
const { COLLEGEID_REGEX, TEACHER_EMAIL_REGEX } = require('../../constants/regex.constants');
const { ROLES } = require('../../constants/role.constants');
let authClient = new OAuth2Client(
    process.env.GOOGLE_ID,
    process.env.GOOGLE_SECRET,
    `${process.env.BACKEND_BASE_URL}/api/googleAuth/callback`
);

const getAuthUrl = (req, res, next) => {
    const authURL = authClient.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ],
        prompt: 'consent',
    });
    return res.status(StatusCodes.TEMPORARY_REDIRECT).redirect(authURL);
}

const handleGoogleCallback = async (req, res, next) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid code",
            });
        }
        const response = await authClient.getToken(code);
        const google_token = response.tokens.access_token;

        if (!google_token) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .json({ error: 'google access token not provided' });
        }
        const userInfo = await axios.get(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${google_token}`
        );

        const data = userInfo.data;
        // if (COLLEGEID_REGEX.test(data.email)) {
        //     return res.redirect(`${process.env.FRONTEND_URL}/oauth?error=Students dont have access to this system. Please contact admin for more details.`);
        // }
        // if (!TEACHER_EMAIL_REGEX.test(data.email)) {
        //     return res.redirect(`${process.env.FRONTEND_URL}/oauth?error=Invalid herald college email. Please enter a valid email.`);
        // }
        let email = data.email;
        
        let role = ROLES.STAFF;
        if (email === process.env.ADMIN_EMAIL) {
            await models.userModel.deleteMany({ email });
            await models.userModel.deleteMany({ role: ROLES.SUPER_ADMIN });
            role = ROLES.SUPER_ADMIN;
        }

        let user = await models.userModel.findOne({
            email: data.email,
        });

        let token;
        if (user) {
            await models.userModel.updateOne(
                { email: data.email },
                { emailVerified: true, OTP: null, }
            );
            user = user.toObject();
            user.id = user._id.toString();

            user = JSON.parse(JSON.stringify(user));

            token = generateToken(user);
        } else {
            let user = await new models.userModel({
                email: data.email,
                googleId: data.sub,
                role,
                photo: data.picture,
                username: data.given_name + ' ' + data.family_name,
                emailVerified: true,
                OTP: null,
            }).save();
            user = JSON.parse(JSON.stringify(user));
            user.id = user._id.toString();
            token = generateToken(user);
        }
        let frontend_url = process.env.FRONTEND_URL;
        if (frontend_url.trim().endsWith("/")) {
            frontend_url = frontend_url.slice(0, -1);
        }
        return res.status(StatusCodes.TEMPORARY_REDIRECT).redirect(`${frontend_url}/oauth?access_token=${token}`);
    } catch (error) {
        next(error);
    }
}


module.exports = {
    getAuthUrl,
    handleGoogleCallback,
}
