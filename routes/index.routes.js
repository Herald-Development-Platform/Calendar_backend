const router = require("express").Router();

// Importing Middlewares
const {
    verifyToken,
    checkAdmin
} = require("../middlewares/auth.middleware");


//Upload Routes
router.post("/file", upload.single("image"), uploadImage);
router.get("/files/:filename", getFile);


module.exports = router;