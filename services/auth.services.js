const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required for auth services');
}

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10d' });
}

module.exports = {
    generateToken
}