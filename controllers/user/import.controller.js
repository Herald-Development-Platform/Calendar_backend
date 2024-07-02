const { StatusCodes } = require("http-status-codes");
const xlsx = require("xlsx");
const fs = require("fs");
const models = require("../../models/index.model");
const bcrypt = require("bcrypt");

const {
    extractTeacherData,
} = require("../../utils/upload.utils");

const { ROLES } = require("../../constants/role.constants");
const { sendEmail } = require("../../services/email.services");

const uploadUsers = async (req, res, next) => {
    if (!Object.keys(req.files).length) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            success: false,
            message: "Invalid file format,only .xlxs accepted",
        });
    }
    try {
        const {
            file: [file],
        } = req.files;
        const xlxsFile = xlsx.readFile(file.path);
        console.log(file);
        let uploaded_teachers = [];
        let failed_to_read_rows = [];
        xlxsFile.SheetNames.forEach((sheet_name) => {
            let sheet_data = xlsx.utils.sheet_to_json(
                xlxsFile.Sheets[sheet_name]
            );
            sheet_data.forEach((excelRow) => {
                extractedTeachers = extractTeacherData(excelRow);
                if (extractedTeachers.length)
                    uploaded_teachers.push(...extractedTeachers);
                else failed_to_read_rows.push(excelRow);
            });
        });

        await Promise.all(
            uploaded_teachers.map(async (teacher) => {
                if (!(teacher.name === undefined) || teacher.email === undefined) {
                    console.log(teacher.name, teacher.email);
                    try {
                        console.log(teacher);
                        const alreadyExistingUser = await models.userModel.findOne({
                            email: teacher.email,
                        });
                        if (alreadyExistingUser) {
                            failed_to_read_rows.push({
                                name: teacher.name,
                                email: teacher.email,
                                reason: "User already exists with the email",
                            });
                            return;
                        }
                        const randomPassword = Math.random().toString(36).slice(-8);
                        const hashedPassword = await bcrypt.hash(randomPassword, 10);
                        const newUser = await new models.userModel({
                            username: teacher.name,
                            email: teacher.email,
                            role: ROLES.STAFF,
                            password: hashedPassword,
                            emailVerified: true,
                        }).save();
                        const response = await sendEmail(teacher.email, [], [], "Welcome to Herald Intra Calendar", `Hello ${teacher.name},\n\nYou have been added to the Herald Intra Calendar. You can now login to your account using the following credentials:\n\nUsername: ${teacher.email}\nPassword: ${randomPassword}\n\nPlease change your password after logging in.\n\nRegards,\nHerald Intra Calendar Team`);
                    } catch (error) {
                        console.log(error.message)
                    }
                }
            })
        );
        fs.unlinkSync(file.path);

        if (failed_to_read_rows.length) {
            return res.status(StatusCodes.OK).json({
                message: "Teacher file uploaded partially",
                failedRows: failed_to_read_rows,
            });
        }
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Teacher file upload was successful!",
        });
    } catch (error) {
        next(error);
    }
};



module.exports = {
    uploadUsers,
};
