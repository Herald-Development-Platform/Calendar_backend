const ProcurementConfigModel = require("../../models/procurementConfig.model");
const { StatusCodes } = require("http-status-codes");

const createProcurementConfig = async (req, res, next) => {
  try {
    const existingConfig = await ProcurementConfigModel.findOne({});
    if (existingConfig) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Procurement config already exists. Only one config is allowed.",
      });
    }

    const newConfig = new ProcurementConfigModel(req.body);
    await newConfig.save();

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Procurement config created successfully",
      data: newConfig,
    });
  } catch (error) {
    next(error);
  }
};

const getProcurementConfig = async (req, res, next) => {
  try {
    const config = await ProcurementConfigModel.findOne({}).populate("procurementDept");
    if (!config) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Procurement config not found",
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Procurement config fetched successfully",
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

const updateProcurementConfig = async (req, res, next) => {
  try {
    const config = await ProcurementConfigModel.findOne({});
    if (!config) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Procurement config not found",
      });
    }

    const updatedConfig = await ProcurementConfigModel.findByIdAndUpdate(config._id, req.body, {
      new: true,
      runValidators: true,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Procurement config updated successfully",
      data: updatedConfig,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProcurementConfig = async (req, res, next) => {
  try {
    const config = await ProcurementConfigModel.findOne({});
    if (!config) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Procurement config not found",
      });
    }

    await ProcurementConfigModel.findByIdAndDelete(config._id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Procurement config deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProcurementConfig,
  getProcurementConfig,
  updateProcurementConfig,
  deleteProcurementConfig,
};
