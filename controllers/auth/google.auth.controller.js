const { google } = require("googleapis");
const { StatusCodes } = require("http-status-codes");
const axios = require("axios");
const { generateToken } = require("../../services/auth.services");

const models = require("../../models/index.model");
const { COLLEGEID_REGEX, TEACHER_EMAIL_REGEX } = require("../../constants/regex.constants");
const { ROLES } = require("../../constants/role.constants");
const { encrypt } = require("../../services/encryption.services");
let authClient = new google.auth.OAuth2(
  process.env.GOOGLE_ID,
  process.env.GOOGLE_SECRET,
  `${process.env.BACKEND_BASE_URL}/api/googleAuth/callback`
);

if (!process.env.SUPER_ADMIN_EMAILS) {
  throw new Error("SUPER_ADMIN_EMAILS is not defined in .env file");
}

const SUPER_ADMIN_EMAILS = process.env.SUPER_ADMIN_EMAILS?.toLowerCase().split(",");

const getAuthUrl = (req, res, next) => {
  const authURL = authClient.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      // scope for google calendar
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    prompt: "consent",
  });
  return res.status(StatusCodes.TEMPORARY_REDIRECT).redirect(authURL);
};

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
    const googleTokens = response.tokens;
    const encryptedTokens = encrypt(JSON.stringify(googleTokens));

    const googleAccessToken = googleTokens.access_token;

    if (!googleAccessToken) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "google access token not provided" });
    }
    const userInfo = await axios.get(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleAccessToken}`
    );

    const data = userInfo.data;
    if (!process.env.ALLOW_INVALID_EMAILS) {
      if (COLLEGEID_REGEX.test(data.email)) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/oauth?error=Students dont have access to this system. Please contact admin for more details.`
        );
      }
      if (!TEACHER_EMAIL_REGEX.test(data.email)) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/oauth?error=Invalid herald college email. Please enter a valid email.`
        );
      }
    }
    let email = data.email;

    let role = ROLES.STAFF;
    if (SUPER_ADMIN_EMAILS.includes(email)) {
      // await models.userModel.deleteMany({ role: ROLES.SUPER_ADMIN, email: { $ne: email } });
      role = ROLES.SUPER_ADMIN;
    }

    let user = await models.userModel.findOne({
      email: data.email,
    });

    let token;
    if (user) {
      await models.userModel.updateOne(
        {
          email: data.email,
        },
        {
          emailVerified: true,
          OTP: null,
          googleTokens: encryptedTokens,
        }
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
        username: data.given_name + " " + data.family_name,
        emailVerified: true,
        OTP: null,
        googleTokens: encryptedTokens,
      }).save();
      user = JSON.parse(JSON.stringify(user));
      user.id = user._id.toString();
      token = generateToken(user);
    }
    let frontend_url = process.env.FRONTEND_URL;
    if (frontend_url.trim().endsWith("/")) {
      frontend_url = frontend_url.slice(0, -1);
    }
    return res
      .status(StatusCodes.TEMPORARY_REDIRECT)
      .redirect(`${frontend_url}/oauth?access_token=${token}`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuthUrl,
  handleGoogleCallback,
};
