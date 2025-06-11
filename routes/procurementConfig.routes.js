const express = require("express");
const procurementConfigRouter = express.procurementConfigRouter();
const {
	createProcurementConfig,
	getProcurementConfig,
	updateProcurementConfig,
	deleteProcurementConfig,
} = require("../controllers/procurementConfig/procurementConfig.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

procurementConfigRouter
	.route("/proc-config")
	.post(createProcurementConfig)
	.get(getProcurementConfig)
	.put(verifyToken, updateProcurementConfig)
	.delete(verifyToken, deleteProcurementConfig);

module.exports = procurementConfigRouter;
