const {
  createColumn,
  getColumns,
  getColumnById,
  updateColumn,
  toggleArchiveColumn,
  deleteColumn,
  reorderColumns,
  getColumnStats,
} = require("../../controllers/taskmanagement/column.controller.js");
const { verifyToken } = require("../../middlewares/auth.middleware");
const columnsRouter = require("express").Router();

columnsRouter.route("/").post(verifyToken, createColumn).get(verifyToken, getColumns);

columnsRouter.route("/reorder").post(verifyToken, reorderColumns);

columnsRouter
  .route("/:id")
  .get(verifyToken, getColumnById)
  .put(verifyToken, updateColumn)
  .delete(verifyToken, deleteColumn);

columnsRouter.patch("/:id/toggle-archive", verifyToken, toggleArchiveColumn);
columnsRouter.get("/:id/stats", verifyToken, getColumnStats);

module.exports = columnsRouter;
