const router = require("express").Router();

const authRouter = require("./auth.routes");
const eventRouter = require("./event.routes");
const userRouter = require("./user.routes");


router.use(authRouter);
router.use(eventRouter);
router.use(userRouter);

//Upload Routes
// router.post("/file", upload.single("image"), uploadImage);
// router.get("/files/:filename", getFile);


module.exports = router;