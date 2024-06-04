const fs = require("fs");
const path = require("path");
const { StatusCodes } = require("http-status-codes");
try {
  if (!fs.existsSync(path.resolve(__dirname, "../..", 'files'))) {
    fs.mkdirSync(path.resolve(__dirname, "../..", 'files'));
  }
} catch (error) {
  console.error("Error creating upload folder:", error);
}

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "No file uploaded" });
    }
    const filename = req.file.filename;
    return res.status(StatusCodes.OK).json({ url: `/files/${filename}` });
  } catch (error) {
    next(error);
  }
}

const getFile = async (req, res, next) => {
  try {
    const filename = req.params.filename;

    const filePath = path.resolve(__dirname, "..", 'files', filename);
    if (fs.existsSync(filePath) === false) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "File not found" });
    }
    return res.sendFile(filePath);
  }
  catch (error) {
    next(error);
  }
}


module.exports = {
  uploadImage,
  getFile
}
