const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  archiveTask,
  getTasksByColumn,
  deleteTask,
  getArchivedTasks,
  updateTasksPostions,
  moveTask,
  getInvitedTasks,
} = require("../../controllers/taskmanagement/task.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");

const tasksRouter = require("express").Router();

tasksRouter
  .route("/")
  .post(verifyToken, createTask)
  .get(verifyToken, getTasks)
  .patch(verifyToken, updateTasksPostions); // Route to create a task and get all tasks

tasksRouter.route("/move").put(verifyToken, moveTask); // Route to move tasks

tasksRouter.route("/column/:columnId").get(verifyToken, getTasksByColumn); // Assuming this gets tasks by column

tasksRouter.route("/archive").get(verifyToken, getArchivedTasks);

tasksRouter.route("/invited").get(verifyToken, getInvitedTasks); // Route to get tasks where the user is invited

tasksRouter.route("/:id/archive").put(verifyToken, archiveTask);

tasksRouter
  .route("/:id")
  .get(verifyToken, getTaskById)
  .put(verifyToken, updateTask)
  .delete(verifyToken, deleteTask);

// Route to get archived tasks
module.exports = tasksRouter;
