const mongoose = require("mongoose");

const BaseMongooseSchema = require("./base.schema");

const departmentSchema = new BaseMongooseSchema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    admins: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ]
});

const DepartmentModel = mongoose.model("Departments", departmentSchema);
module.exports = DepartmentModel;