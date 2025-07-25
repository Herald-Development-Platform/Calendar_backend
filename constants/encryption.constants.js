const crypto = require("crypto");

const ACCESS_SECRET = process.env.JWT_SECRET;

const _ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(String(ACCESS_SECRET))
  .digest("hex")
  .substring(0, 32);

module.exports = { _ENCRYPTION_KEY };
