
const { OAuth2Client } = require('google-auth-library');
const { StatusCodes } = require('http-status-codes');
const axios = require('axios');
const {
    generateToken,
} = require("../../services/auth.services");

const models = require('../../models/index.model');
let authClient = new OAuth2Client(
    process.env.GOOGLE_ID,
    process.env.GOOGLE_SECRET,
    `http://localhost:10000/api/googleAuth/callback`
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
        const user = await models.userModel.findOne({
            email: data.email,
        });
        let token;
        if (user) {
            await models.userModel.updateOne(
                { email: data.email },
                { emailVerified: true, OTP: null, }
            );

            token = generateToken(user.toObject());
        } else {
            const user = await new models.userModel({
                email: data.email,
                googleId: data.sub,
                photo: data.picture,
                username: data.given_name + ' ' + data.family_name,
                emailVerified: true,
                OTP: null,
            }).save();

            token = generateToken(user.toObject());
        }
        let frontend_url = process.env.FRONTEND_URL
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
