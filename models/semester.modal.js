const mongoose = require("mongoose");
const BaseMongooseSchema = require("./base.schema");
const { RECURRING_TYPES } = require("../constants/event.constants");

const semestersSchema = new BaseMongooseSchema({
  semester: { type: String, required: true },
  course: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  color: { type: String, required: true },
});

const SemesterModel = mongoose.model("Semesters", semestersSchema);
module.exports = SemesterModel;
