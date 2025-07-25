const mongoose = require("mongoose");
const BaseMongooseSchema = require("./base.schema");

const locationSchema = new BaseMongooseSchema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  block: String,
  description: String,
});

const locationModel = mongoose.model("Locations", locationSchema);
module.exports = locationModel;
