const columnsRouter = require("./column.routes");
const commentsRouter = require("./comment.routes");
const labelsRouter = require("./label.routes");
const tasksRouter = require("./tasks.routes");

const taskManagementRouter = require("express").Router();

taskManagementRouter.use("/tasks", tasksRouter);
taskManagementRouter.use("/columns", columnsRouter);
taskManagementRouter.use("/labels", labelsRouter);
taskManagementRouter.use("/comments", commentsRouter);

module.exports = taskManagementRouter;
