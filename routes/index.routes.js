const router = require("express").Router();

const authRouter = require("./auth.routes");
const eventRouter = require("./event.routes");


router.use(authRouter);
router.use(eventRouter);

// //Upload Routes
// router.post("/file", upload.single("image"), uploadImage);
// router.get("/files/:filename", getFile);


module.exports = router;