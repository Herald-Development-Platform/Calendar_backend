const mongoose = require('mongoose');
const BaseMongooseSchema = require('./base.schema');
const { ROLES } = require('../constants/role.constants');

const userSchema = new BaseMongooseSchema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
  },
  profilePicture: String,
  role: {
    type: String,
    enum: Object.values(ROLES),
    required: true,
  },
});

const UserModel = mongoose.model('Users', userSchema);
module.exports = UserModel;