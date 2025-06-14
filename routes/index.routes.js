const router = require("express").Router();
const upload = require("../services/multer.services");

const authRouter = require("./auth.routes");
const departmentRouter = require("./department.routes");
const eventRouter = require("./event.routes");
const userRouter = require("./user.routes");
const notificationRouter = require("./notification.routes");
const commonRouter = require("./common.routes");
const semesterRouter = require("./semester.routes");
const rpcRouter = require("./rpc.routes");
const procurementConfigRouter = require("./procurementConfig.routes");
const taskManagementRouter = require("./taskmanagement");

const { uploadImage, getFile } = require("../controllers/upload/upload.controller");

router.use(authRouter);
router.use(eventRouter);
router.use(userRouter);
router.use(departmentRouter);
router.use(notificationRouter);
router.use(commonRouter);
router.use(semesterRouter);
router.use(procurementConfigRouter);
router.use("/task-management", taskManagementRouter);
router.use("/rpc", rpcRouter);

router.post("/file", upload.single("image"), uploadImage);
router.get("/files/:filename", getFile);

module.exports = router;
