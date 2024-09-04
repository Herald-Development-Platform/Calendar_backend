
const { StatusCodes } = require("http-status-codes");
const xlsx = require("xlsx");
const fs = require("fs");
const models = require("../../models/index.model");
const { makePascalCase } = require("../../utils/string.utils");
const { getRandomColor } = require("../../utils/color.utils");
const { convertExcelDateToJSDate } = require("../../utils/date.utils");

const extractSemesterData = async ({
  row,
  sheetName,
  rowIndex,
  semesters,
}) => {
  let rowValidated = {};
  Object.keys(row).forEach((value) => {
    let newKey = value.trim().toLowerCase().replaceAll(/[^a-zA-Z0-9]/ig, "");
    switch (newKey) {
      case "semester":
      case "semestername":
      case "name":
      case "title":
        rowValidated["semester"] = makePascalCase(row[value]?.trim());
        break;
      case "course":
      case "coursename":
      case "coursecode":
        rowValidated["course"] = row[value]?.trim()?.toUpperCase() ?? "";
        break;
      case "start":
      case "startdate":
      case "commencement":
      case "commencedate":
      case "commencingdate":
      case "commence":
      case "commencementdate":
        let startDate = convertExcelDateToJSDate(row[value]);
        if (startDate instanceof Date && !isNaN(startDate)) {
          rowValidated["start"] = startDate;
        }
        break;
      case "end":
      case "enddate":
      case "semesterend":
      case "semesterfinish":
      case "closing":
      case "semesterclosing":
      case "ending":
        let endDate = convertExcelDateToJSDate(row[value]);
        if (endDate instanceof Date && !isNaN(endDate)) {
          rowValidated["end"] = endDate;
        }
        break;
      default:
        rowValidated[newKey] = row[value].toString().trim();
        break;
    }
  });
  const result = {
    sheetName,
    rowIndex,
    originalRow: { ...row },
    data: { ...rowValidated },
  };
  if (!result.data.semester) {
    result.reason = "Couldn't read the 'semester'!";
  }
  if (!result.data.course) {
    result.reason = "Couldn't read the 'course'!";
  }
  if (!result.data.start) {
    result.reason = "Couldn't read the 'start' of semester!";
  }
  if (!result.data.end) {
    result.reason = "Couldn't read the 'end' of semester!";
  }
  if (result.data.start > result.data.end) {
    result.reason = "Start date is greater than end date!";
  }
  if (!result.data.color) {
    result.data.color = getRandomColor();
  }

  if (result.reason) {
    result.success = false;
  } else {
    result.success = true;
  }

  return result;
};

fs.mkdirSync(`${__dirname}/../../uploads/semesterUpload`, { recursive: true });
const saveUploadedSemesters = async (req, res, next) => {
  try {
    const {
      file: [file],
    } = req.files;

    let data = [];

    const xlxsFile = xlsx.readFile(file.path);
    xlxsFile.SheetNames.forEach((sheet_name) => {
      let sheet_data = xlsx.utils.sheet_to_json(xlxsFile.Sheets[sheet_name]);
      sheet_data.forEach((excelRow, i) => {
        data.push({
          excelRow,
          sheetName: sheet_name,
          rowIndex: i + 2,
        });
      });
    });

    let extracted = await Promise.all(
      data.map((row) =>
        extractSemesterData({
            row: row.excelRow,
            sheetName: row.sheetName,
            rowIndex: row.rowIndex,
        })
      )
    );
    
    let failedRows = extracted.filter((row) => !row.success);
    let validRows = extracted.filter((row) => row.success);

    if (failedRows.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `${failedRows.length} rows failed to validate!`,
        data: failedRows,
      });
    }

    const insertedData = await Promise.all(
      validRows.map(async (row) => {
        let insertedSemester = await new models.semesterModel({
          ...(row.data),
        }).save();
        return insertedSemester.toObject();
      })
     );

    fs.unlinkSync(file.path);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Semester file uploaded successfully",
      data: insertedData
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
    saveUploadedSemesters,
};
