const mongoose = require('mongoose');
const BaseMongooseSchema = require('./base.schema');
const { ROLES } = require('../constants/role.constants');
const { DEPARTMENTS } = require('../constants/departments.constants');

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
  photo: String,
  role: {
    type: String,
    enum: Object.values(ROLES),
    required: true,
  },
  department: {
    type: String,
    enum: Object.values(DEPARTMENTS),
    required: true,
  }
});

const UserModel = mongoose.model('Users', userSchema);
module.exports = UserModel;