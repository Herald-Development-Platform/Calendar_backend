const { StatusCodes } = require("http-status-codes");
const models = require("../../models/index.model");

// Create a new label
const createLabel = async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Label title is required"
      });
    }

    // Check if label with same title already exists for this user
    const existingLabel = await models.labelModel.findOne({
      title: title.trim(),
      createdBy: req.user._id,
      isArchived: false
    });

    if (existingLabel) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Label with this title already exists"
      });
    }

    // Get the highest position for ordering
    const lastLabel = await models.labelModel
      .findOne({ createdBy: req.user._id, isArchived: false })
      .sort({ position: -1 });

    const newLabel = await new models.labelModel({
      title: title.trim(),
      position: lastLabel ? lastLabel.position + 1 : 0,
      createdBy: req.user._id
    }).save();

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Label created successfully",
      data: newLabel
    });
  } catch (error) {
    next(error);
  }
};

// Get all labels for the current user
const getLabels = async (req, res, next) => {
  try {
    const { includeArchived = false, search = "" } = req.query;

    let query = { createdBy: req.user._id };

    if (!includeArchived || includeArchived === 'false') {
      query.isArchived = false;
    }

    if (search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const labels = await models.labelModel
      .find(query)
      .sort({ position: 1, createdAt: 1 });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Labels fetched successfully",
      data: labels,
      count: labels.length
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific label
const getLabelById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const label = await models.labelModel.findOne({
      _id: id,
      createdBy: req.user._id
    });

    if (!label) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Label not found"
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Label fetched successfully",
      data: label
    });
  } catch (error) {
    next(error);
  }
};

// Update a label
const updateLabel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, position } = req.body;

    const label = await models.labelModel.findOne({
      _id: id,
      createdBy: req.user._id
    });

    if (!label) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Label not found"
      });
    }

    // Check for duplicate title if title is being updated
    if (title && title.trim() !== label.title) {
      const existingLabel = await models.labelModel.findOne({
        title: title.trim(),
        createdBy: req.user._id,
        isArchived: false,
        _id: { $ne: id }
      });

      if (existingLabel) {
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: "Label with this title already exists"
        });
      }
    }

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (position !== undefined) updateData.position = position;

    const updatedLabel = await models.labelModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Label updated successfully",
      data: updatedLabel
    });
  } catch (error) {
    next(error);
  }
};

// Archive/Unarchive a label
const toggleArchiveLabel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const label = await models.labelModel.findOne({
      _id: id,
      createdBy: req.user._id
    });

    if (!label) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Label not found"
      });
    }

    const updatedLabel = await models.labelModel.findByIdAndUpdate(
      id,
      { isArchived: !label.isArchived },
      { new: true }
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Label ${updatedLabel.isArchived ? 'archived' : 'unarchived'} successfully`,
      data: updatedLabel
    });
  } catch (error) {
    next(error);
  }
};

// Delete a label permanently
const deleteLabel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const label = await models.labelModel.findOne({
      _id: id,
      createdBy: req.user._id
    });

    if (!label) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Label not found"
      });
    }

    // Check if label is being used in any tasks
    const tasksUsingLabel = await models.taskModel.countDocuments({
      labels: id,
      createdBy: req.user._id
    });

    if (tasksUsingLabel > 0) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: `Cannot delete label. It is being used in ${tasksUsingLabel} task(s). Archive it instead.`
      });
    }

    await models.labelModel.findByIdAndDelete(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Label deleted successfully",
      data: { deletedId: id }
    });
  } catch (error) {
    next(error);
  }
};

// Reorder labels
const reorderLabels = async (req, res, next) => {
  try {
    const { labelIds } = req.body;

    if (!Array.isArray(labelIds) || labelIds.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Label IDs array is required"
      });
    }

    // Verify all labels belong to the user
    const labels = await models.labelModel.find({
      _id: { $in: labelIds },
      createdBy: req.user._id
    });

    if (labels.length !== labelIds.length) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Some labels not found or unauthorized"
      });
    }

    // Update positions
    const updatePromises = labelIds.map((labelId, index) =>
      models.labelModel.findByIdAndUpdate(labelId, { position: index })
    );

    await Promise.all(updatePromises);

    // Fetch updated labels
    const updatedLabels = await models.labelModel
      .find({ _id: { $in: labelIds } })
      .sort({ position: 1 });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Labels reordered successfully",
      data: updatedLabels
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLabel,
  getLabels,
  getLabelById,
  updateLabel,
  toggleArchiveLabel,
  deleteLabel,
  reorderLabels
};