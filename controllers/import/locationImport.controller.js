const { StatusCodes } = require("http-status-codes");
const xlsx = require("xlsx");
const fs = require("fs");
const models = require("../../models/index.model");

const extractLocationData = async ({ row, sheetName, rowIndex, locations }) => {
  let rowValidated = {};
  Object.keys(row).forEach(value => {
    let newKey = value
      .trim()
      .toLowerCase()
      .replaceAll(/[^a-zA-Z0-9]/gi, "");
    switch (newKey) {
      case "name":
      case "title":
      case "place":
        rowValidated["name"] = row[value]?.trim();
        break;
      case "description":
      case "details":
        rowValidated["description"] = row[value]?.trim() ?? "";
        break;
      case "block":
      case "building":
      case "branch":
        rowValidated["block"] = row[value]?.trim().toUpperCase();
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
    result.reason = "Couldn't read the 'name' of location!";
  }

  locations.forEach(location => {
    if (location.name?.toLowerCase().trim() === result.data?.name?.toLowerCase().trim()) {
      result.reason = `Location with name '${result.data.name}' already exists!`;
    }
  });

  if (result.reason) {
    result.success = false;
  } else {
    result.success = true;
  }

  return result;
};

fs.mkdirSync(`${__dirname}/../../uploads/locationUploads`, { recursive: true });
const saveUploadedLocations = async (req, res, next) => {
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

    let locations = await models.locationModel.find({});
    locations = locations.map(location => location.toObject());

    let extracted = await Promise.all(
      data.map(row =>
        extractLocationData({
          row: row.excelRow,
          sheetName: row.sheetName,
          rowIndex: row.rowIndex,
          locations,
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

    const insertedLocations = await Promise.all(
      validRows.map(async row => {
        let insertedLocation = await new models.locationModel({
          ...row.data,
        }).save();
        return insertedLocation.toObject();
      })
    );

    fs.unlinkSync(file.path);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Location file uploaded successfully",
      data: insertedLocations,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  saveUploadedLocations,
};
