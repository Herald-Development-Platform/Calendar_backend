const {
  createLabel,
  getLabels,
  reorderLabels,
  getLabelById,
  updateLabel,
  deleteLabel,
  toggleArchiveLabel,
} = require("../../controllers/taskmanagement/label.controller");
const { verifyToken } = require("../../middlewares/auth.middleware");

const labelsRouter = require("express").Router();

labelsRouter.route("/").post(verifyToken, createLabel).get(verifyToken, getLabels);

labelsRouter.route("/reorder").post(verifyToken, reorderLabels);

labelsRouter
  .route("/:id")
  .get(verifyToken, getLabelById)
  .put(verifyToken, updateLabel)
  .delete(verifyToken, deleteLabel);

labelsRouter.patch("/:id/toggle-archive", verifyToken, toggleArchiveLabel);

module.exports = labelsRouter;
