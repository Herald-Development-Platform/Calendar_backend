const { StatusCodes } = require("http-status-codes");
const xlsx = require("xlsx");
const fs = require("fs");
const models = require("../../models/index.model");
const bcrypt = require("bcrypt");

const { ROLES } = require("../../constants/role.constants");
const { sendEmail } = require("../../services/email.services");
const { DEFAULT_PERMISSIONS } = require("../../constants/permissions.constants");
const { getImportRegistrationHTML } = require("../../emails/registration.html");
const { makePascalCase, generateRandomString } = require("../../utils/string.utils");

// from other side of the world
const extractUserData = async ({ row, sheetName, rowIndex, departments, userDepartment }) => {
  let rowValidated = {};
  Object.keys(row).forEach(value => {
    let newKey = value
      .trim()
      .toLowerCase()
      .replaceAll(/[^a-zA-Z0-9]/gi, "");
    console.log("New Key", newKey);
    switch (newKey) {
      case "email":
      case "gmail":
      case "collegeemail":
      case "collegesemail":
      case "useremail":
      case "usersemail":
        rowValidated["email"] = row[value]?.trim()?.toLowerCase();
        break;
      case "username":
      case "usersname":
      case "staff":
      case "user":
      case "staffsname":
      case "staffname":
      case "teacher":
      case "teachername":
      case "teachersname":
      case "name":
      case "fullname":
        rowValidated["username"] = row[value] ? makePascalCase(row[value]?.trim()) : "";
        break;
      case "department":
      case "departments":
      case "branch":
      case "section":
        const foundDepartment = departments.find(val => {
          let regex = new RegExp(row[value], "ig");
          return regex.test(val.name) || regex.test(val.code);
        });
        if (foundDepartment) {
          rowValidated["department"] = foundDepartment._id;
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
  if (!result.data.email) {
    result.reason = "Couldn't read the 'email' of user!";
  }
  if (!result.data.username) {
    result.reason = "Couldn't read the 'username' of user!";
  }
  if (result.data.department) {
    if (userDepartment && result.data.department.toString() !== userDepartment?._id.toString()) {
      result.reason = "You cannot create users for other departments!";
    }
  }
  if (result.reason) {
    result.success = false;
  } else {
    result.success = true;
  }

  if (result.success) {
    const alreadyExistingUser = await models.userModel
      .findOne({
        email: result.data.email.trim().toLowerCase(),
        department: {
          $exists: true,
        },
      })
      .populate("department");

    if (alreadyExistingUser && alreadyExistingUser.department) {
      result.reason = "User already exists with that email.";
      result.success = false;
    }
  }
  return result;
};

fs.mkdirSync(`${__dirname}/../../uploads/userUploads`, { recursive: true });
const saveUploadedUsers = async (req, res, next) => {
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

    let userDepartment = req.user?.department;

    console.log("User Department", userDepartment);

    let extracted = await Promise.all(
      data.map(row =>
        extractUserData({
          row: row.excelRow,
          sheetName: row.sheetName,
          rowIndex: row.rowIndex,
          departments,
          userDepartment,
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

    const insertedUsers = await Promise.all(
      validRows.map(async row => {
        const randomPassword = generateRandomString(8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const deletedAlreadyUnverifiedUser = await models.userModel.deleteMany({
          email: row.data.email,
          $or: [
            {
              department: {
                $exists: false,
              },
            },
            {
              department: null,
            },
          ],
        });
        const newUser = await new models.userModel({
          ...row.data,
          password: hashedPassword,
          emailVerified: true,
          role: ROLES.STAFF,
          permissions: DEFAULT_PERMISSIONS.STAFF_PERMISSIONS,
        }).save();
        const response = await sendEmail(
          newUser.email,
          [],
          [],
          "Welcome to Herald Intra Calendar",
          getImportRegistrationHTML(newUser.username, newUser.email, randomPassword)
        );
        return {
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
          password: randomPassword,
        };
      })
    );

    fs.unlinkSync(file.path);

    // export the email, username and password of success rows to excel again
    const wb = xlsx.utils.book_new();
    const wsUsers = xlsx.utils.json_to_sheet(
      insertedUsers.map(data => {
        return {
          email: data.email,
          username: data.username,
          password: data.password,
        };
      })
    );
    xlsx.utils.book_append_sheet(wb, wsUsers, "Uploaded Users");

    const reportFilename = `userupload-report-${new Date().getTime()}.xlsx`;
    xlsx.writeFile(wb, `${__dirname}/../../uploads/userUploads/${reportFilename}`);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "User file uploaded successfully",
      data: {
        insertedUsers,
        uploadReportFilename: `${reportFilename}`,
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getUserUploadReport = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const file = `${__dirname}/../../uploads/userUploads/${filename}`;
    if (!fs.existsSync(file)) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "File not found.",
      });
    }
    return res.status(StatusCodes.OK).download(file);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveUploadedUsers,
  getUserUploadReport,
};
