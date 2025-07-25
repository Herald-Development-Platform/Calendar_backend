const { Schema, default: mongoose } = require("mongoose");
const BaseMongooseSchema = require("./base.schema");

const userDetailSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  {
    _id: false,
  }
);

const procurmentConfigSchema = new BaseMongooseSchema({
  procurementDept: { type: Schema.Types.ObjectId, ref: "Departments", required: true },
  ceoDetails: { type: userDetailSchema, required: true },
  procHeadDetails: { type: userDetailSchema, required: true },
});

const ProcurementConfigModel = mongoose.model("ProcurementConfig", procurmentConfigSchema);

module.exports = ProcurementConfigModel;
