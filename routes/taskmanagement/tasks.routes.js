const {
	createTask,
	getTasks,
	getTaskById,
	updateTask,
	deleteTask,
} = require("../../controllers/taskmanagement/task.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");

const tasksRouter = require("express").Router();

tasksRouter.route("/").post(verifyToken, createTask).get(verifyToken, getTasks);

tasksRouter
	.route("/:id")
	.get(verifyToken, getTaskById)
	.put(verifyToken, updateTask)
	.delete(verifyToken, deleteTask);

module.exports = tasksRouter;
