const mongoose = require("mongoose");
const BaseMongooseSchema = require("./base.schema");

const semestersSchema = new BaseMongooseSchema({
  course: { type: String, required: true },
  semester: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  color: { type: String, required: true },
});

const SemesterModel = mongoose.model("Semesters", semestersSchema);
module.exports = SemesterModel;
