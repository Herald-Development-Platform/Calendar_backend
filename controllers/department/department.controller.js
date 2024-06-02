const { ROLES } = require("../../constants/role.constants");
const models = require("../../models/index.model");
const { StatusCodes } = require("http-status-codes");

const createDepartment = async (req, res, next) => {
    try {
        const {
            name,
            code,
        } = req.body;

        const alreadyExisting = await models.departmentModel.findOne({
            $or: [
                { name: name },
                { code: code }
            ]
        });

        if (alreadyExisting) {
            return res.status(StatusCodes.CONFLICT).json({
                success: false,
                message: "Department with name or code already exists",
            });
        }

        const newDepartment = await new models.departmentModel({
            ...req.body,
        }).save();

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Department created successfully",
            data: newDepartment,
        });
    } catch (error) {
        next(error);
    }
}

const getDepartmentByIdOrCode = async (codeOrId) => {
    try {
        let department = await models.departmentModel.findById(codeOrId);
        if (!department) {
            department = await models.departmentModel.findOne({ code: codeOrId });
        }
        return {
            success: true,
            message: "Department fetched successfully",
            data: department,
        };
    } catch (error) {
        return {
            sucess: true,
            error: "Department not found",
        }
    }
}

const getDepartments = async (req, res, next) => {
    try {
        const departments = await models.departmentModel.find({});
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Departments fetched successfully",
            data: departments,
        });
    } catch (error) {
        next(error);
    }
}

const getDepartmentById = async (req, res, next) => {
    try {
        return res.status(StatusCodes.OK).json(await getDepartmentByIdOrCode(req.params.departmentId));
    } catch (error) {
        next(error);
    }
}

const updateDepartment = async (req, res, next) => {
    try {
        const { data: department } = await getDepartmentByIdOrCode(req.params.departmentId);
        if (!department) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Department not found",
            });
        }

        if (req.body.admins) {
            delete req.body.admins;
        }

        const updatedDepartment = await models.departmentModel.findByIdAndUpdate(department._id, req.body, { new: true });
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Department updated successfully",
            data: updatedDepartment,
        });
    } catch (error) {
        next(error);
    }
}

const addAdminToDepartment = async (req, res, next) => {
    try {
        const { data: department } = await getDepartmentByIdOrCode(req.params.departmentId);
        if (!department) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Department not found",
            });
        }
        if (!req.body.userId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Please userId to add as admin",
            });
        }
    } catch (error) {
        next(error);
    }
}

const removeAdminFromDepartment = async (req, res, next) => {
    try {
        const { data: department } = await getDepartmentByIdOrCode(req.params.departmentId);
        if (!department) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Department not found",
            });
        }
        if (!req.body.userId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Please userId to remove from admin",
            });
        }
        const updatedDepartment = await models.departmentModel.findByIdAndUpdate(department._id,
            {
                $pull: { admins: req.body.userId }
            },
            { new: true }
        );
        const updatedUser = await models.userModel.findByIdAndUpdate(req.body.userId,
            {
                role: ROLES.STAFF,
            }
        )
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Admin removed from department successfully. The user is now a staff.",
            data: { updatedDepartment, updatedUser },
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    addAdminToDepartment,
    removeAdminFromDepartment,
};