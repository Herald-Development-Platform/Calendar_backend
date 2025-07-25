const { StatusCodes } = require("http-status-codes");
const models = require("../../models/index.model");

const hasTaskAccess = (task, userId) => {
  console.log("Checking task access for user:", userId);
  console.log("Task details:", task);

  console.log("has access:", task?.createdBy?.toString() === userId?.toString());
  return (
    task?.createdBy?._id?.toString() === userId?.toString() ||
    task?.invitedUsers?.some(invitedId => invitedId === userId)
  );
};

const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      column,
      priority,
      dueDate,
      startDate,
      estimatedHours,
      labels,
      invitedUsers,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Task title is required",
      });
    }

    if (!column) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Column is required",
      });
    }

    const targetColumn = await models.columnModel.findOne({
      _id: column,
      createdBy: req.user._id,
      isArchived: false,
    });

    if (!targetColumn) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Column not found or unauthorized",
      });
    }

    if (labels && labels.length > 0) {
      const userLabels = await models.labelModel.find({
        _id: { $in: labels },
        createdBy: req.user._id,
        isArchived: false,
      });

      if (userLabels.length !== labels.length) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Some labels not found or unauthorized",
        });
      }
    }

    if (invitedUsers && invitedUsers.length > 0) {
      const existingUsers = await models.userModel.find({
        _id: { $in: invitedUsers },
      });

      if (existingUsers.length !== invitedUsers.length) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Some invited users not found",
        });
      }
    }

    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Start date cannot be after due date",
      });
    }

    const lastTask = await models.taskModel
      .findOne({ column, createdBy: req.user._id, isArchived: false })
      .sort({ position: -1 });

    const newTask = await new models.taskModel({
      title: title.trim(),
      description: description?.trim() || "",
      column,
      position: lastTask ? lastTask.position + 1 : 0,
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      estimatedHours,
      labels: labels || [],
      invitedUsers: invitedUsers || [],
      createdBy: req.user._id,
    }).save();

    const populatedTask = await models.taskModel
      .findById(newTask._id)
      .populate("column", "title position")
      .populate("labels", "title position")
      .populate("invitedUsers", "username email")
      .populate("createdBy", "username email");

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Task created successfully",
      data: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const {
      column,
      labels,
      priority,
      isCompleted,
      includeArchived = false,
      search = "",
      dueDate,
      page = 1,
      limit = 50,
      sortBy = "position",
      sortOrder = "asc",
    } = req.query;

    let query = {
      $or: [{ createdBy: req.user._id }, { invitedUsers: req.user._id }],
    };

    if (!includeArchived || includeArchived === "false") {
      query.isArchived = false;
    }

    if (column) {
      query.column = column;
    }

    if (labels) {
      const labelIds = Array.isArray(labels) ? labels : labels.split(",");
      query.labels = { $in: labelIds };
    }

    if (priority) {
      query.priority = priority;
    }

    if (isCompleted !== undefined) {
      query.isCompleted = isCompleted === "true";
    }

    if (search.trim()) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search.trim(), $options: "i" } },
          { description: { $regex: search.trim(), $options: "i" } },
        ],
      });
    }

    if (dueDate) {
      const date = new Date(dueDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.dueDate = { $gte: date, $lt: nextDay };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    const tasks = await models.taskModel
      .find(query)
      .populate("column", "title position")
      .populate("labels", "title position")
      .populate("invitedUsers", "username email")
      .populate("createdBy", "username email")
      .populate("completedBy", "username email")
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const totalTasks = await models.taskModel.countDocuments(query);
    const totalPages = Math.ceil(totalTasks / parseInt(limit));

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Tasks fetched successfully",
      data: tasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalTasks,
        itemsPerPage: parseInt(limit),
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

//Get tasks by column
const getTasksByColumn = async (req, res, next) => {
  try {
    const { columnId } = req.params;

    // tasks created by the user or invited to the user
    const tasks = await models.taskModel
      .find({
        column: columnId,
        $or: [{ createdBy: req.user._id }, { invitedUsers: req.user._id }],
        isArchived: false,
      })
      .populate("column", "title position")
      .populate("labels", "title position")
      .populate("invitedUsers", "username email")
      .populate("createdBy", "username email")
      .populate("completedBy", "username email")
      .populate("archivedBy", "username email")
      .populate("checklist.completedBy", "username email")
      .sort({ position: 1 });

    if (!tasks) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "No tasks found for this column",
      });
    }

    if (tasks.length === 0) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "No tasks found for this column",
        data: [],
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific task
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await models.taskModel
      .findById(id)
      .populate("column", "title position")
      .populate("labels", "title position")
      .populate("invitedUsers", "username email")
      .populate("createdBy", "username email")
      .populate("completedBy", "username email")
      .populate("archivedBy", "username email")
      .populate("checklist.completedBy", "username email");

    if (!task) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check access
    if (!hasTaskAccess(task, req.user._id)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You don't have access to this task",
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Task fetched successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// Update a task
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const task = await models.taskModel.findById(id);

    if (!task) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user is owner (only owner can update main task details)
    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only task owner can update task details",
      });
    }

    // Verify column if being updated
    if (updateData.column) {
      const targetColumn = await models.columnModel.findOne({
        _id: updateData.column,
        createdBy: req.user._id,
        isArchived: false,
      });

      if (!targetColumn) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Column not found or unauthorized",
        });
      }
    }

    // Verify labels if being updated
    if (updateData.labels) {
      const userLabels = await models.labelModel.find({
        _id: { $in: updateData.labels },
        createdBy: req.user._id,
        isArchived: false,
      });

      if (userLabels.length !== updateData.labels.length) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Some labels not found or unauthorized",
        });
      }
      updateData.labels = userLabels.map(label => label._id);
    }
    // Validate dates
    if (updateData.startDate && updateData.dueDate) {
      const startDate = new Date(updateData.startDate);
      const dueDate = new Date(updateData.dueDate);

      if (startDate > dueDate) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Start date cannot be after due date",
        });
      }
    }

    const checklistData = updateData.checklist?.map(item => {
      return {
        text: item.text.trim(),
        isCompleted: item.isCompleted || false,
      };
    });
    // Update task
    const updatedTask = await models.taskModel
      .findByIdAndUpdate(
        id,
        {
          ...updateData,
          checklist: checklistData || task.checklist,
          updatedAt: new Date(),
          updatedBy: req.user._id,
        },
        { new: true }
      )
      .populate("column", "title position")
      .populate("labels", "title position")
      .populate("invitedUsers", "username email")
      .populate("createdBy", "username email")
      .populate("completedBy", "username email")
      .populate("archivedBy", "username email")
      .populate("checklist.completedBy", "username email");
    if (!updatedTask) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Task not found",
      });
    }
    // Check access
    if (!hasTaskAccess(updatedTask, req.user._id)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You don't have access to this task",
      });
    }
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

const archiveTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await models.taskModel.findById(id);
    if (!task) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Task not found",
      });
    }

    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only task owner can delete task",
      });
    }

    task.isArchived = true;
    task.archivedAt = new Date();
    task.archivedBy = req.user._id;
    await task.save();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Task archived successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

const getArchivedTasks = async (req, res, next) => {
  try {
    const tasks = await models.taskModel
      .find({
        $or: [{ createdBy: req.user._id }, { invitedUsers: req.user._id }],
        isArchived: true,
      })
      .populate("column", "title position")
      .populate("labels", "title position")
      .populate("invitedUsers", "username email")
      .populate("createdBy", "username email")
      .populate("completedBy", "username email")
      .populate("archivedBy", "username email")
      .populate("checklist.completedBy", "username email");

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Archived tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

const getInvitedTasks = async (req, res, next) => {
  try {
    const tasks = await models.taskModel
      .find({ invitedUsers: req.user._id, isArchived: false })
      .populate("column", "title position")
      .populate("labels", "title position")
      .populate("invitedUsers", "username email")
      .populate("createdBy", "username email")
      .populate("completedBy", "username email")
      .populate("archivedBy", "username email")
      .populate("checklist.completedBy", "username email");

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Invited tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await models.taskModel.findById(id);
    if (!task) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Task not found",
      });
    }

    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only task owner can delete task",
      });
    }

    await task.deleteOne();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const updateTasksPostions = async (req, res, next) => {
  try {
    const { tasks } = req.body;

    if (
      !Array.isArray(tasks) ||
      tasks.length === 0 ||
      tasks.some(task => !task._id || task.position === undefined)
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid task positions data",
      });
    }

    const bulkOps = tasks.map(task => ({
      updateOne: {
        filter: { _id: task._id, createdBy: req.user._id },
        update: { position: task.position },
      },
    }));

    await models.taskModel.bulkWrite(bulkOps);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Task positions updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

const moveTask = async (req, res, next) => {
  try {
    const { taskId, newColumnId, newPosition, affectedTasks } = req.body;

    if (!taskId || !newColumnId || newPosition === undefined || !Array.isArray(affectedTasks)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid move task data",
      });
    }

    // Update the moved task's column and position
    await models.taskModel.findByIdAndUpdate(
      taskId,
      {
        column: newColumnId,
        position: newPosition,
      },
      { new: true }
    );

    // Update positions for all affected tasks
    const bulkOps = affectedTasks.map(task => ({
      updateOne: {
        filter: { _id: task._id, createdBy: req.user._id },
        update: { position: task.position },
      },
    }));

    if (bulkOps.length > 0) {
      await models.taskModel.bulkWrite(bulkOps);
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Task moved successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTasksByColumn,
  getTaskById,
  updateTask,
  archiveTask,
  getArchivedTasks,
  deleteTask,
  updateTasksPostions,
  moveTask,
  getInvitedTasks,
};
