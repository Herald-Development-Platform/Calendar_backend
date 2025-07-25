const { StatusCodes } = require("http-status-codes");
const xlsx = require("xlsx");
const fs = require("fs");
const models = require("../../models/index.model");
const { makePascalCase } = require("../../utils/string.utils");

const extractDepartmentData = async ({ row, sheetName, rowIndex, departments }) => {
  let rowValidated = {};
  Object.keys(row).forEach(value => {
    let newKey = value
      .trim()
      .toLowerCase()
      .replaceAll(/[^a-zA-Z0-9]/gi, "");
    switch (newKey) {
      case "departmentname":
      case "name":
      case "title":
        rowValidated["name"] = makePascalCase(row[value]?.trim());
        break;
      case "code":
      case "short":
      case "shortname":
      case "shortcode":
      case "departmentcode":
        rowValidated["code"] = row[value]?.trim()?.toUpperCase() ?? "";
        break;
      case "description":
      case "details":
        rowValidated["description"] = row[value]?.trim();
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
  if (!result.data.name) {
    result.reason = "Couldn't read the 'name' of department!";
  }
  if (!result.data.code) {
    result.reason = "Couldn't read the 'code' of department!";
  }

  departments.find(department => {
    if (department.name?.toLowerCase().trim() === result.data?.name?.toLowerCase().trim()) {
      result.reason = `Department with name '${result.data.name}' already exists!`;
      return true;
    }
    if (department.code?.toLowerCase().trim() === result.data?.code?.toLowerCase().trim()) {
      result.reason = `Department with code '${result.data.code}' already exists!`;
      return true;
    }
    return false;
  });

  if (result.reason) {
    result.success = false;
  } else {
    result.success = true;
  }

  return result;
};

fs.mkdirSync(`${__dirname}/../../uploads/departmentUpload`, { recursive: true });
const saveUploadedDepartments = async (req, res, next) => {
  try {
    const {
      file: [file],
    } = req.files;

    let data = [];

    const xlxsFile = xlsx.readFile(file.path);
    xlxsFile.SheetNames.forEach(sheet_name => {
      let sheet_data = xlsx.utils.sheet_to_json(xlxsFile.Sheets[sheet_name]);
      sheet_data.forEach((excelRow, i) => {
        data.push({
          excelRow,
          sheetName: sheet_name,
          rowIndex: i + 2,
        });
      });
    });

    let departments = await models.departmentModel.find({});
    departments = departments.map(department => department.toObject());

    let extracted = await Promise.all(
      data.map(row =>
        extractDepartmentData({
          row: row.excelRow,
          sheetName: row.sheetName,
          rowIndex: row.rowIndex,
          departments,
        })
      )
    );

    let failedRows = extracted.filter(row => !row.success);
    let validRows = extracted.filter(row => row.success);

    if (failedRows.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `${failedRows.length} rows failed to validate!`,
        data: failedRows,
      });
    }

    const insertedData = await Promise.all(
      validRows.map(async row => {
        let insertedDepartment = await new models.departmentModel({
          ...row.data,
        }).save();
        return insertedDepartment.toObject();
      })
    );

    fs.unlinkSync(file.path);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Department file uploaded successfully",
      data: insertedData,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  saveUploadedDepartments,
};
