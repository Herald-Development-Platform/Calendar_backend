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
        
        const newDepartment = new models.departmentModel({
            ...req.body,
        });

        if (req.body.admins && req.body.admins.length > 0) {
            const admins = await models.userModel.find({ _id: { $in: req.body.admins } }).populate("department");
            if (admins.length !== req.body.admins.length) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Some of the admins do not exist",
                });
            }

            for (let user of admins) {
                if (user.role === ROLES.DEPARTMENT_ADMIN) {
                    return res.status(StatusCodes.CONFLICT).json({
                        success: false,
                        message: `User is already admin of ${user.department?.code} department`
                    })
                }
            }
            
            await models.userModel.updateMany(
                { _id: { $in: req.body.admins } },
                { 
                    role: ROLES.DEPARTMENT_ADMIN,
                    department: newDepartment._id
                 }
            );
        }

        await newDepartment.save();

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
        let department = await models.departmentModel.findOne({ code: codeOrId });
        if (!department) {
            department = await models.departmentModel.findById(codeOrId);
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
        if (req.body.code) {
            const alreadyExisting = await models.departmentModel.findOne({
                code: req.body.code
            });
            if (alreadyExisting && alreadyExisting._id.toString() !== department._id.toString()){
                return res.status(StatusCodes.CONFLICT).json({
                    success: false,
                    message: "Department with code already exists",
                });
            }
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

const deleteDepartment = async (req, res, next) => {
    try {
        const { departmentId } = req.params;
        const {data: department} = await getDepartmentByIdOrCode(departmentId);
        if (!department) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Department not found",
            });
        }
        console.log(department)
        await models.userModel.updateMany(
            { department: department._id },
            { department: null }
        );
        await models.userModel.updateMany(
            { department: department._id, role: ROLES.DEPARTMENT_ADMIN }, 
            { department: null, role: ROLES.STAFF }
        );

        const deletedDepartment = await models.departmentModel.findByIdAndDelete(department._id);
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Department deleted successfully",
            data: deletedDepartment,
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
        if (!req.params.userId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Please provide userId to add as admin",
            });
        }
        const newAdmin = await models.userModel.findById(req.params.userId).populate("department");
        if (!newAdmin) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "User not found",
            });
        }

        if (newAdmin.role === ROLES.DEPARTMENT_ADMIN) {
            return res.status(StatusCodes.CONFLICT).json({
                success: false,
                message: `User is already admin of ${newAdmin.department?.code} department`
            })
        }

        const updatedDepartment = await models.departmentModel.findByIdAndUpdate(department._id,
            {
                $push: { admins: req.params.userId }
            },
            { new: true }
        );
        const updatedUser = await models.userModel.findByIdAndUpdate(req.params.userId,
            {
                role: ROLES.DEPARTMENT_ADMIN,
                department: updatedDepartment._id
            },
            { new: true }
        )
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Admin added to department successfully",
            data: { updatedDepartment, updatedUser },
        });

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
        if (!req.params.userId) {
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
    getDepartmentByIdOrCode,
    updateDepartment,
    addAdminToDepartment,
    removeAdminFromDepartment,
    deleteDepartment,
};