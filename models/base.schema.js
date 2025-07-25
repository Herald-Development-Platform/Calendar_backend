const mongoose = require("mongoose");
class BaseMongooseSchema extends mongoose.Schema {
  constructor(...args) {
    super(...args);
    this.createdAt = {
      type: Date,
      default: Date.now,
    };
    this.updatedAt = {
      type: Date,
      default: Date.now,
    };
    this.virtual("id").get(function () {
      return this._id.toString();
    });
    this.set("toJSON", {
      virtuals: true,
    });
    this.set("toObject", {
      virtuals: true,
    });
  }
}

module.exports = BaseMongooseSchema;
