const express = require("express");
const {
  createProcurementConfig,
  getProcurementConfig,
  updateProcurementConfig,
  deleteProcurementConfig,
} = require("../controllers/procurementConfig/procurementConfig.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

const procurementConfigRouter = express.Router();

procurementConfigRouter
  .route("/proc-config")
  .post(createProcurementConfig)
  .get(getProcurementConfig)
  .put(verifyToken, updateProcurementConfig)
  .delete(verifyToken, deleteProcurementConfig);

module.exports = procurementConfigRouter;
