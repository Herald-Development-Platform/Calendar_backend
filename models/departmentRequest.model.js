const mongoose = require("mongoose");
const { REQUEST_STATES } = require("../constants/departmentRequest.constants");

const departmentRequestSchema = new mongoose.Schema({
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Departments',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(REQUEST_STATES),
        default: REQUEST_STATES.PENDING,
    },
    requestedAt: {
        type: Date,
        default: Date.now,
    },
    notes: String,
});


const DepartmentRequestModel = mongoose.model('DepartmentRequest', departmentRequestSchema);
module.exports = DepartmentRequestModel;
