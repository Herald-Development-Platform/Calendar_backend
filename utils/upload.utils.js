const { TEACHER_EMAIL_REGEX, COLLEGEID_REGEX } = require("../constants/regex.constants");

const extractTeacherData = (excelRow) => {
    let emails = [];
    let names = [];

    Object.keys(excelRow).forEach((key) => {
        let value = excelRow[key].toString().trim();

        if (COLLEGEID_REGEX.test(value)) {
            emails.push(value);
        } else if (TEACHER_EMAIL_REGEX.test(value)) {
            emails.push(value);
        }
        // Checking if the value is not SN and contains a whitespace because
        // full names contain whitespace, others don't
        if (!parseInt(value) && value.includes(" ")) {
            names.push(excelRow[key].toString().trim());
        }
    });

    let teachers = [];
    // Now mapping the uids, names and group serially to get the students
    let i = 0;
    while (i < emails.length && i < names.length) {
        teachers.push({
            email: emails[i],
            name: names[i],
        });
        i++;
    }
    return teachers;
};

module.exports = {
    extractTeacherData,
};