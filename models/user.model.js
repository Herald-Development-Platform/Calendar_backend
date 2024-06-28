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
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Departments'
  },
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
  },
  googleTokens: {
    iv: String,
    tokenHash: String
  },
  importantDates: [Date],
});

userSchema.pre("find", function (next) {
  delete this.OTP;
  delete this.otpExpiryDate;
  delete this.password;
  next();
});
userSchema.pre("findOne", function (next) {
  delete this.OTP;
  delete this.otpExpiryDate;
  delete this.password;
  next();
});
userSchema.pre("findById", function (next) {
  delete this.OTP;
  delete this.otpExpiryDate;
  delete this.password;
  next();
});
userSchema.post("save", function () {
  delete this.OTP;
  delete this.otpExpiryDate;
  delete this.password;
});

// remove the otp, expiry and password on toJSON and toObject
userSchema.options.toJSON = {
  transform: function (doc, ret) {
    delete ret.OTP;
    delete ret.otpExpiryDate;
    delete ret.password;
    delete ret.googleTokens;
    return ret;
  }
};

userSchema.options.toObject = {
  transform: function (doc, ret) {
    delete ret.OTP;
    delete ret.otpExpiryDate;
    delete ret.password;
    delete ret.googleTokens;
    return ret;
  }
};

const UserModel = mongoose.model('Users', userSchema);
module.exports = UserModel;