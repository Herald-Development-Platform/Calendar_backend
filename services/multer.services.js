const multer = require("multer");
const path = require("path");
const sanitize = require("sanitize-filename");

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadFolder = path.resolve(__dirname, "..", "files");
      cb(null, uploadFolder);
    },
    filename: function (req, file, cb) {
      let originalName = file.originalname;
      if (originalName.length > 10) {
        originalName = originalName.substring(originalName.length - 10, originalName.length);
      }
      const sanitizedFilename = sanitize(`${Date.now()}-${originalName}`);
      cb(null, sanitizedFilename);
    },
  }),
  fileFilter: function (req, file, cb) {
    console.log("Mimetype: " + file.mimetype.toLowerCase());
    if (file.mimetype.toLowerCase().includes("image")) {
      cb(null, true);
    } else {
      cb(new Error("Not an image"));
    }
  },
});

module.exports = upload;
