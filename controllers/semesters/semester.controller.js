const { StatusCodes } = require("http-status-codes");
const models = require("../../models/index.model.js");

const createSemester = async (req, res, next) => {
  try {
    const result = await new models.semesterModel(req.body).save();
    res.status(StatusCodes.CREATED).json({
      sucess: true,
      message: "Create semester successfully.",
      data: result,
    });
  } catch (err) {
    console.error("Semester Err", err);
    next(err);
  }
};

const getAllSemester = async (req, res, next) => {
  try {
    const result = await models.semesterModel.find({});
    console.log("getSemester", result);

    res.status(StatusCodes.OK).json({
      sucess: true,
      message: "Successfully fetched semester.",
      data: result,
    });
  } catch (err) {
    console.error("Semester Err", err);
    next(err);
  }
};

const updateSemester = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await models.semesterModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!result) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Semester not found" });
    }

    res.status(StatusCodes.OK).json({
      sucess: true,
      message: "Updated semester successfully.",
      data: result,
    });
  } catch (err) {
    console.error("Semester Err", err);
    next(err);
  }
};

const deleteSemester = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await models.semesterModel.findByIdAndDelete(id);

    if (!result) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Could not find the semester with that ID.",
      });
    }

    res.status(StatusCodes.OK).json({
      sucess: true,
      message: "Deleted semester successfully.",
      data: result,
    });
  } catch (err) {
    console.error("Semester Err", err);
    next(err);
  }
};

module.exports = {
  createSemester,
  getAllSemester,
  updateSemester,
  deleteSemester,
};
