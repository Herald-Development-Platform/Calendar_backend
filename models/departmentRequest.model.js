const mongoose = require("mongoose");
const { REQUEST_STATES } = require("../constants/departmentRequest.constants");

const departmentRequestSchema = new mongoose.Schema({
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(REQUEST_STATES),
        default: REQUEST_STATES.PENDING,
    },
    notes: String,
});


const DepartmentRequestModel = mongoose.model('DepartmentRequest', departmentRequestSchema);
module.exports = DepartmentRequestModel;
