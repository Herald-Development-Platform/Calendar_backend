const mongoose = require('mongoose');
const BaseMongooseSchema = require('./base.schema');
const { ROLES } = require('../constants/role.constants');
const { PERMISSIONS } = require('../constants/permissions.constants');

const userSchema = new BaseMongooseSchema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  password: String,
  username: {
    type: String,
    required: true,
  },
  photo: String,
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.STAFF,
    required: true,
  },
  department: mongoose.Schema.Types.ObjectId,
  permissions: [
    {
      type: String,
      enum: Object.values(PERMISSIONS),
      required: true,
    }
  ],
  OTP: {
    type: String,
    default: null
  },
  otpExpiryDate: {
    type: Date,
    default: null
  }
});

const UserModel = mongoose.model('Users', userSchema);
module.exports = UserModel;