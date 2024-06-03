
const models = require("../../models/index.model");
const { StatusCodes } = require("http-status-codes");
const { getDepartmentByIdOrCode } = require("../department/department.controller");

const createDepartmentRequest = async (req, res, next) => {
    try {
        const { department, user, notes } = req.body;
        const { data: departmentData } = await getDepartmentByIdOrCode(department);

        if (!departmentData) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Department not found' });
        }

        const departmentRequest = new models.departmentRequestModel({
            department: departmentData._id,
            user,
            notes
        });

        



    } catch (error) {
        next(error);
    }
}

const getDepartmentRequests = async (req, res, next) => {
    try {

    } catch (error) {
        next(error);
    }
}

const getDepartmentRequest = async (req, res, next) => {
    try {

    } catch (error) {
        next(error);
    }
}

const approveDepartmentRequest = async (req, res, next) => {
    try {

    } catch (error) {
        next(error);
    }
}


const rejectDepartmentRequest = async (req, res, next) => {
    try {

    } catch (error) {
        next(error);
    }
}



module.exports = {
    createDepartmentRequest,

}
