const { StatusCodes } = require("http-status-codes");

const semesterModal = require("../../models/semester.modal.js");

const createSemester = async (req, res, next) => {
  try {
    const result = await semesterModal.create(req.body);
    res.status(201).json({
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
    const result = await semesterModal.find({});
    console.log("getSemester", result);

    res.status(200).json({
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
    const result = await semesterModal.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    console.log("event --- control", result);

    if (!result) {
      return res
        .status(400)
        .json({ success: false, message: "Semester not found" });
    }

    res.status(201).json({
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
    const result = await semesterModal.findByIdAndDelete(id);

    if (!result) {
      return res.status(400).json({
        success: false,
        message: "Could not find the semester with that ID.",
      });
    }

    res.status(201).json({
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
