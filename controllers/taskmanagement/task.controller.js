const { StatusCodes } = require("http-status-codes");
const models = require("../../models/index.model");

const hasTaskAccess = (task, userId) => {
    return task?.createdBy?.toString() === userId?.toString() ||
        task?.invitedUsers?.some(invitedId => invitedId?.toString() === userId?.toString());
};

const createTask = async (req, res, next) => {
    try {
        const { title, description, column, priority, dueDate, startDate, estimatedHours, labels, invitedUsers } = req.body;

        if (!title || !title.trim()) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Task title is required"
            });
        }

        if (!column) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Column is required"
            });
        }

        const targetColumn = await models.columnModel.findOne({
            _id: column,
            createdBy: req.user._id,
            isArchived: false
        });

        if (!targetColumn) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Column not found or unauthorized"
            });
        }

        if (labels && labels.length > 0) {
            const userLabels = await models.labelModel.find({
                _id: { $in: labels },
                createdBy: req.user._id,
                isArchived: false
            });

            if (userLabels.length !== labels.length) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Some labels not found or unauthorized"
                });
            }
        }

        if (invitedUsers && invitedUsers.length > 0) {
            const existingUsers = await models.userModel.find({
                _id: { $in: invitedUsers }
            });

            if (existingUsers.length !== invitedUsers.length) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Some invited users not found"
                });
            }
        }

        if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Start date cannot be after due date"
            });
        }

        const lastTask = await models.taskModel
            .findOne({ column, createdBy: req.user._id, isArchived: false })
            .sort({ position: -1 });

        const newTask = await new models.taskModel({
            title: title.trim(),
            description: description?.trim() || '',
            column,
            position: lastTask ? lastTask.position + 1 : 0,
            priority: priority || 'medium',
            dueDate: dueDate ? new Date(dueDate) : undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            estimatedHours,
            labels: labels || [],
            invitedUsers: invitedUsers || [],
            createdBy: req.user._id
        }).save();

        const populatedTask = await models.taskModel
            .findById(newTask._id)
            .populate('column', 'title position')
            .populate('labels', 'title position')
            .populate('invitedUsers', 'username email')
            .populate('createdBy', 'username email');

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Task created successfully",
            data: populatedTask
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
            sortBy = 'position',
            sortOrder = 'asc'
        } = req.query;

        let query = {
            $or: [
                { createdBy: req.user._id },
                { invitedUsers: req.user._id }
            ]
        };

        if (!includeArchived || includeArchived === 'false') {
            query.isArchived = false;
        }

        if (column) {
            query.column = column;
        }

        if (labels) {
            const labelIds = Array.isArray(labels) ? labels : labels.split(',');
            query.labels = { $in: labelIds };
        }

        if (priority) {
            query.priority = priority;
        }

        if (isCompleted !== undefined) {
            query.isCompleted = isCompleted === 'true';
        }

        if (search.trim()) {
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { title: { $regex: search.trim(), $options: 'i' } },
                    { description: { $regex: search.trim(), $options: 'i' } }
                ]
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
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const tasks = await models.taskModel
            .find(query)
            .populate('column', 'title position')
            .populate('labels', 'title position')
            .populate('invitedUsers', 'username email')
            .populate('createdBy', 'username email')
            .populate('completedBy', 'username email')
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
                hasPrev: parseInt(page) > 1
            }
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
            .populate('column', 'title position')
            .populate('labels', 'title position')
            .populate('invitedUsers', 'username email')
            .populate('createdBy', 'username email')
            .populate('completedBy', 'username email')
            .populate('archivedBy', 'username email')
            .populate('checklist.completedBy', 'username email');

        if (!task) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Task not found"
            });
        }

        // Check access
        if (!hasTaskAccess(task, req.user._id)) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: "You don't have access to this task"
            });
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Task fetched successfully",
            data: task
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
                message: "Task not found"
            });
        }

        // Check if user is owner (only owner can update main task details)
        if (task.createdBy.toString() !== req.user._id.toString()) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: "Only task owner can update task details"
            });
        }

        // Verify column if being updated
        if (updateData.column) {
            const targetColumn = await models.columnModel.findOne({
                _id: updateData.column,
                createdBy: req.user._id,
                isArchived: false
            });

            if (!targetColumn) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Column not found or unauthorized"
                });
            }
        }

        // Verify labels if being updated
        if (updateData.labels) {
            const userLabels = await models.labelModel.find({
                _id: { $in: updateData.labels },
                createdBy: req.user._id,
                isArchived: false
            });

            if (userLabels.length !== updateData.labels.length) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Some labels not found or unauthorized"
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
                    message: "Start date cannot be after due date"
                });
            }
        }
        // Update task
        const updatedTask = await models.taskModel.findByIdAndUpdate(
            id,
            {
                ...updateData,
                updatedAt: new Date(),
                updatedBy: req.user._id
            },
            { new: true }
        )
            .populate('column', 'title position')
            .populate('labels', 'title position')
            .populate('invitedUsers', 'username email')
            .populate('createdBy', 'username email')
            .populate('completedBy', 'username email')
            .populate('archivedBy', 'username email')
            .populate('checklist.completedBy', 'username email');
        if (!updatedTask) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Task not found"
            });
        }
        // Check access
        if (!hasTaskAccess(updatedTask, req.user._id)) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: "You don't have access to this task"
            });
        }
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Task updated successfully",
            data: updatedTask
        });
    }
    catch (error) {
        next(error);
    }
}

const deleteTask = async (req, res, next) => {
    try {
        const { id } = req.params;

        const task = await models.taskModel.findById(id);
        if (!task) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Task not found"
            });
        }

        if (task.createdBy.toString() !== req.user._id.toString()) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: "Only task owner can delete task"
            });
        }

        task.isArchived = true;
        task.archivedAt = new Date();
        task.archivedBy = req.user._id;
        await task.save();

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Task archived successfully",
            data: task
        });
    }
    catch (error) {
        next(error);
    }
}

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask
};