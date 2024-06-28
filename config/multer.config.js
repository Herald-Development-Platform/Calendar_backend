const multer = require("multer");
const path = require("path");
const sanitize_filename = require("sanitize-filename");
const fs = require("fs");

const userUploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = `${__dirname}/../../uploads/teacherUploads`;
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const date = new Date();
        const prefix = date.toString().slice(0, 24).split(" ").join("-");
        cb(null, sanitize_filename(prefix + "-" + file.originalname));
    },
});

const teacherUpload = multer({
    storage: userUploadStorage,
    // fileFilter: uploadFilter,
}).fields([{ name: "file", maxCount: 1 }]);


module.exports = {
    teacherUpload,
};