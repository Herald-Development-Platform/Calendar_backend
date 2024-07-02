const { StatusCodes } = require("http-status-codes");
const { decrypt } = require("../../services/encryption.services");
const { google } = require("googleapis")

const getGoogleEvents = (req, res, next) => {
    const { googleTokens } = req.user;
    if (!googleTokens) {
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

    const calendar = google.calendar({ version: 'v3', auth: authClient });

    calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
    }, (err, response) => {
        if (err) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Failed to fetch events',
                error: err.message,
            });
        }
        const events = response.data.items;
        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Events fetched successfully',
            data: events,
        });
    });

}

module.exports = {
    getGoogleEvents,
}
