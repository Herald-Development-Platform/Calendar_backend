const router = require("express").Router();
const upload = require("../services/multer.services");

const authRouter = require("./auth.routes");
const departmentRouter = require("./department.routes");
const eventRouter = require("./event.routes");
const userRouter = require("./user.routes");
const notificationRouter = require("./notification.routes");

router.use(authRouter);
router.use(eventRouter);
router.use(userRouter);
router.use(departmentRouter);
router.use(notificationRouter);

//Upload Routes
const { uploadImage, getFile } = require("../controllers/upload/upload.controller");
router.post("/file", upload.single("image"), uploadImage);
router.get("/files/:filename", getFile);


module.exports = router;