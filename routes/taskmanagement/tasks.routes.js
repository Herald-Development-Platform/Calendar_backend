const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  archiveTask,
  getTasksByColumn,
  deleteTask,
  getArchivedTasks,
} = require("../../controllers/taskmanagement/task.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");

const tasksRouter = require("express").Router();

tasksRouter.route("/").post(verifyToken, createTask).get(verifyToken, getTasks);

tasksRouter.route("/column/:columnId").get(verifyToken, getTasksByColumn); // Assuming this gets tasks by column

tasksRouter.route("/archive").get(verifyToken, getArchivedTasks);

tasksRouter
  .route("/:id/archive")
  .put(verifyToken, archiveTask); // Route to archive a task

tasksRouter
  .route("/:id")
  .get(verifyToken, getTaskById)
  .put(verifyToken, updateTask)
  .delete(verifyToken, deleteTask);

// Route to get archived tasks
module.exports = tasksRouter;
