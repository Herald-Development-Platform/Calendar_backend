const { StatusCodes } = require("http-status-codes");
const models = require("../../models/index.model");

// Create a new column
const createColumn = async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Column title is required",
      });
    }

    // Check if column with same title already exists for this user
    const existingColumn = await models.columnModel.findOne({
      title: title.trim(),
      createdBy: req.user._id,
      isArchived: false,
    });

    if (existingColumn) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Column with this title already exists",
      });
    }

    // Get the highest position for ordering
    const lastColumn = await models.columnModel
      .findOne({ createdBy: req.user._id, isArchived: false })
      .sort({ position: -1 });

    const newColumn = await new models.columnModel({
      title: title.trim(),
      position: lastColumn ? lastColumn.position + 1 : 0,
      createdBy: req.user._id,
    }).save();

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Column created successfully",
      data: newColumn,
    });
  } catch (error) {
    next(error);
  }
};

// Get all columns for the current user
const getColumns = async (req, res, next) => {
  try {
    const { includeArchived = false, includeTasks = false } = req.query;

    let query = { createdBy: req.user._id };

    if (!includeArchived || includeArchived === "false") {
      query.isArchived = false;
    }

    let columns = await models.columnModel.find(query).sort({ position: 1, createdAt: 1 });

    // If includeTasks is true, populate with tasks
    if (includeTasks === "true") {
      const columnsWithTasks = await Promise.all(
        columns.map(async column => {
          const tasks = await models.taskModel
            .find({
              column: column._id,
              createdBy: req.user._id,
              isArchived: false,
            })
            .populate("labels", "title position")
            .sort({ position: 1 });

          return {
            ...column.toObject(),
            tasks: tasks,
          };
        })
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Columns with tasks fetched successfully",
        data: columnsWithTasks,
        count: columnsWithTasks.length,
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Columns fetched successfully",
      data: columns,
      count: columns.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific column
const getColumnById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeTasks = false } = req.query;

    const column = await models.columnModel.findOne({
      _id: id,
      createdBy: req.user._id,
    });

    if (!column) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Column not found",
      });
    }

    let responseData = column.toObject();

    if (includeTasks === "true") {
      const tasks = await models.taskModel
        .find({
          column: id,
          createdBy: req.user._id,
          isArchived: false,
        })
        .populate("labels", "title position")
        .sort({ position: 1 });

      responseData.tasks = tasks;
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Column fetched successfully",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

// Update a column
const updateColumn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, position } = req.body;

    const column = await models.columnModel.findOne({
      _id: id,
      createdBy: req.user._id,
    });

    if (!column) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Column not found",
      });
    }

    // Check for duplicate title if title is being updated
    if (title && title.trim() !== column.title) {
      const existingColumn = await models.columnModel.findOne({
        title: title.trim(),
        createdBy: req.user._id,
        isArchived: false,
        _id: { $ne: id },
      });

      if (existingColumn) {
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: "Column with this title already exists",
        });
      }
    }

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (position !== undefined) updateData.position = position;

    const updatedColumn = await models.columnModel.findByIdAndUpdate(id, updateData, { new: true });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Column updated successfully",
      data: updatedColumn,
    });
  } catch (error) {
    next(error);
  }
};

// Archive/Unarchive a column
const toggleArchiveColumn = async (req, res, next) => {
  try {
    const { id } = req.params;

    const column = await models.columnModel.findOne({
      _id: id,
      createdBy: req.user._id,
    });

    if (!column) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Column not found",
      });
    }

    // If archiving, also archive all tasks in this column
    if (!column.isArchived) {
      await models.taskModel.updateMany(
        { column: id, createdBy: req.user._id },
        {
          isArchived: true,
          archivedAt: new Date(),
          archivedBy: req.user._id,
        }
      );
    }

    const updatedColumn = await models.columnModel.findByIdAndUpdate(
      id,
      { isArchived: !column.isArchived },
      { new: true }
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Column ${updatedColumn.isArchived ? "archived" : "unarchived"} successfully`,
      data: updatedColumn,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a column permanently
const deleteColumn = async (req, res, next) => {
  try {
    const { id } = req.params;

    const column = await models.columnModel.findOne({
      _id: id,
      createdBy: req.user._id,
    });

    if (!column) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Column not found",
      });
    }

    // Check if column has tasks
    // const tasksInColumn = await models.taskModel.countDocuments({
    //   column: id,
    //   createdBy: req.user._id
    // });

    // if (tasksInColumn > 0) {
    //   return res.status(StatusCodes.CONFLICT).json({
    //     success: false,
    //     message: `Cannot delete column. It contains ${tasksInColumn} task(s). Archive it instead or move tasks to another column.`
    //   });
    // }

    // change task of this column to archived
    await models.taskModel.updateMany(
      { column: id, createdBy: req.user._id },
      {
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: req.user._id,
      }
    );

    await models.columnModel.findByIdAndDelete(id);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Column deleted successfully",
      data: { deletedId: id },
    });
  } catch (error) {
    next(error);
  }
};

// Reorder columns
const reorderColumns = async (req, res, next) => {
  try {
    const { columnIds } = req.body;

    if (!Array.isArray(columnIds) || columnIds.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Column IDs array is required",
      });
    }

    // Verify all columns belong to the user
    const columns = await models.columnModel.find({
      _id: { $in: columnIds },
      createdBy: req.user._id,
    });

    if (columns.length !== columnIds.length) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Some columns not found or unauthorized",
      });
    }

    // Update positions
    const updatePromises = columnIds.map((columnId, index) =>
      models.columnModel.findByIdAndUpdate(columnId, { position: index })
    );

    await Promise.all(updatePromises);

    // Fetch updated columns
    const updatedColumns = await models.columnModel
      .find({ _id: { $in: columnIds } })
      .sort({ position: 1 });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Columns reordered successfully",
      data: updatedColumns,
    });
  } catch (error) {
    next(error);
  }
};

// Get column statistics
const getColumnStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const column = await models.columnModel.findOne({
      _id: id,
      createdBy: req.user._id,
    });

    if (!column) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Column not found",
      });
    }

    const totalTasks = await models.taskModel.countDocuments({
      column: id,
      createdBy: req.user._id,
      isArchived: false,
    });

    const completedTasks = await models.taskModel.countDocuments({
      column: id,
      createdBy: req.user._id,
      isArchived: false,
      isCompleted: true,
    });

    const overdueTasks = await models.taskModel.countDocuments({
      column: id,
      createdBy: req.user._id,
      isArchived: false,
      isCompleted: false,
      dueDate: { $lt: new Date() },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Column statistics fetched successfully",
      data: {
        column: column,
        stats: {
          totalTasks,
          completedTasks,
          pendingTasks: totalTasks - completedTasks,
          overdueTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createColumn,
  getColumns,
  getColumnById,
  updateColumn,
  toggleArchiveColumn,
  deleteColumn,
  reorderColumns,
  getColumnStats,
};
