const { Schema } = require("mongoose");
const BaseMongooseSchema = require("./base.schema");

const userDetailSchema = new Schema({
	name: { type: String, required: true },
	email: { type: String, required: true },
	phone: { type: String, required: true },
});

const procurmentConfigSchema = new BaseMongooseSchema({
	procurementDeptCode: { type: String, required: true },
	procurementDeptName: { type: String, required: true },
	ceoDetails: userDetailSchema,
	procHeadDetails: userDetailSchema,
});

const ProcurementConfigModel = mongoose.model("ProcurementConfig", procurmentConfigSchema);

module.exports = ProcurementConfigModel;
