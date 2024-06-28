const { _ENCRYPTION_KEY } = require("../constants/encryption.constants");
const crypto = require("crypto");
function encrypt(token) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(_ENCRYPTION_KEY),
        iv
    );
    let encrypted = cipher.update(token, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), tokenHash: encrypted };
}

function decrypt(iv, encryptedToken) {
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(_ENCRYPTION_KEY),
        Buffer.from(iv, 'hex')
    );
    let decrypted = decipher.update(encryptedToken, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}


module.exports = { encrypt, decrypt };