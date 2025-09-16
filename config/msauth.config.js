const dotenv = require('dotenv');
dotenv.config();

console.log(
  'Envs',
  process.env.CLIENT_ID,
  process.env.TENANT_ID,
  process.env.CLIENT_SECRET
);
const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID,
    authority: 'https://login.microsoftonline.com/' + process.env.TENANT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: 3,
    },
  },
};

module.exports = msalConfig;
