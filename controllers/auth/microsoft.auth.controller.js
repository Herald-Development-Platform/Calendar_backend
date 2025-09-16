

const msalClient = new ConfidentialClientApplication(msalConfig);
const cryptoProvider = new CryptoProvider();

const stateCache = new Map();

if (!process.env.SUPER_ADMIN_EMAILS) {
  throw new Error('SUPER_ADMIN_EMAILS is not defined in .env file');
}

const SUPER_ADMIN_EMAILS =
  process.env.SUPER_ADMIN_EMAILS?.toLowerCase().split(',');

export const redirectToMicrosoftAuth = async (req, res, next) => {
  try {
    const { verifier, challenge } = await cryptoProvider.generatePkceCodes();
    const stateId = cryptoProvider.createNewGuid();
    const scopes = ['User.Read', 'profile', 'email', 'openid', 'Mail.Send'];
    const redirectUri = process.env.MICROSOFT_AUTH_REDIRECT_URI;

    const stateData = {
      pkceVerifier: verifier,
      redirectUri: redirectUri,
      createdAt: Date.now(),
      scopes: scopes,
      nonce: cryptoProvider.createNewGuid(),
    };

    const encodedState = cryptoProvider.base64Encode(
      JSON.stringify({ stateId })
    );

    stateCache.set(stateId, stateData);
    setTimeout(() => stateCache.delete(stateId), 10 * 60 * 1000);

    const authUrlParams = {
      scopes: scopes,
      redirectUri: redirectUri,
      responseMode: 'query',
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
      prompt: 'select_account',
      state: encodedState,
      nonce: stateData.nonce,
    };

    const authUrl = await msalClient.getAuthCodeUrl(authUrlParams);

    return res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
};

export const microsoftCallback = async (req, res, next) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Authentication failed',
        data: error_description || error,
      });
    }

    if (!code) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Code and state parameters are not provided by microsoft',
        data: null,
      });
    }

    let decodedState;
    try {
      decodedState = JSON.parse(cryptoProvider.base64Decode(state));
    } catch (e) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid state parameter',
        data: e,
      });
    }

    const stateId = decodedState.stateId;
    const stateData = stateCache.get(stateId);

    // if (!stateData) {
    // 	return res.status(StatusCodes.BAD_REQUEST).json({
    // 		success: false,
    // 		error: "State not found or expired",
    // 		data: null,
    // 	});
    // }

    stateCache.delete(stateId);

    const tokenRequest = {
      code: code,
      scopes: stateData.scopes,
      redirectUri: stateData.redirectUri,
      codeVerifier: stateData.pkceVerifier,
    };

    const tokenResponse = await msalClient.acquireTokenByCode(tokenRequest);
    const ACCESS_TOKEN = tokenResponse.accessToken;
    const userInfo = await getUserData(ACCESS_TOKEN);

    const data = userInfo;

    if (!process.env.ALLOW_INVALID_EMAILS) {
      if (data?.jobTitle?.toLowerCase() === 'student') {
        return res.redirect(
          `${process.env.FRONTEND_URL}/oauth?error=Students dont have access to this system. Please contact admin for more details.`
        );
      }
    }

    let email = data.mail;
    let role = ROLES.STAFF;
    let isVerified = false;
    let accountStatus = 'PENDING';

    if (SUPER_ADMIN_EMAILS.includes(email?.toLowerCase())) {
      role = ROLES.SUPER_ADMIN;
      isVerified = true;
      accountStatus = 'ACTIVE';
    } else {
      isVerified = false;
      accountStatus = 'PENDING';
    }

    let user = await User.findOne({
      email: data?.mail?.toLowerCase(),
    });

    let token;
    if (user) {
      await User.updateOne(
        { email: data.mail?.toLowerCase() },
        {
          emailVerified: true,
          OTP: null,
          microsoftAccessToken: ACCESS_TOKEN,
        }
      );

      user = await User.findOne({ email: data.mail?.toLowerCase() });
      user = user.toObject();
      user.id = user._id.toString();
      user = JSON.parse(JSON.stringify(user));
      delete user.microsoftAccessToken;
      token = generateToken(user);
    } else {
      user = await new User({
        email: data.mail?.toLowerCase(),
        role,
        username: data?.givenName
          ? data.givenName + ' ' + (data.surname || '')
          : data.displayName,
        emailVerified: true,
        OTP: null,
        oauthProvider: 'microsoft',
        isVerified: isVerified || false,
        accountStatus: accountStatus || 'PENDING',
        microsoftAccessToken: ACCESS_TOKEN,
      }).save();

      user = JSON.parse(JSON.stringify(user));
      user.id = user._id.toString();
      delete user.microsoftAccessToken;
      token = generateToken(user);
    }

    let frontend_url = process.env.FRONTEND_URL;
    if (frontend_url.trim().endsWith('/')) {
      frontend_url = frontend_url.slice(0, -1);
    }

    let redirectUrl = `${frontend_url}`;
    if (user.isVerified && user.accountStatus === 'ACTIVE') {
      redirectUrl = `${frontend_url}/oauth?access_token=${token}`;
      return res.status(StatusCodes.TEMPORARY_REDIRECT).redirect(redirectUrl);
    }

    return res
      .status(StatusCodes.TEMPORARY_REDIRECT)
      .redirect(
        `${frontend_url}/oauth?error=Verification Pending. Please contact the administrator.`
      );
  } catch (error) {
    console.error('Error in microsoftCallback:', error);
    next(error);
  }
};

const getUserData = async (accessToken) => {
  try {
    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw new Error(`Failed to fetch user data: ${error.message}`);
  }
};
