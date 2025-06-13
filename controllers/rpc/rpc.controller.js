const UserModel = require("../../models/user.model");
const { ROLES } = require("../../constants/role.constants");
const DepartmentModel = require("../../models/department.model");
const { StatusCodes } = require("http-status-codes");
const ProcurementConfigModel = require("../../models/procurementConfig.model");

const getApprovalChain = async (req, res) => {
	try {
		const { userId } = req.params;
		const procurementConfig = await ProcurementConfigModel.findOne({});
		const user = await UserModel.findById(userId).populate("reportsTo");

		if (!user) {
			return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "User not found" });
		}

		const ceoEmail = procurementConfig.ceoDetails.email;
		if (!ceoEmail) {
			return res
				.status(StatusCodes.NOT_FOUND)
				.json({ success: false, message: "CEO details not found" });
		}

		const ceo = await UserModel.findOne({ email: ceoEmail });
		if (!ceo) {
			return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "CEO not found" });
		}

		const procurementDept = await DepartmentModel.findById(procurementConfig.procurementDept);
		if (!procurementDept) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "Procurement department not found",
			});
		}

		const seen = new Set();
		const approvalChain = [];

		let current = await UserModel.findById(user.reportsTo._id).populate("reportsTo");
		// don't add the current user to the approval chain
		while (current.department !== procurementDept._id || (current && current.email !== ceo.email)) {
			if (!seen.has(current._id.toString())) {
				approvalChain.push({
					_id: current._id,
					username: current.username,
					email: current.email,
					role: current.role,
					department: current.department,
					modifiedBy: current._id,
				});
				seen.add(current._id.toString());
			}

			if (!current.reportsTo) break;
			current = await UserModel.findById(current.reportsTo._id).populate("reportsTo");
			if (current.email === ceo.email) break;
		}

		const procurementHead = await UserModel.findOne({
			role: ROLES.DEPARTMENT_ADMIN,
			department: procurementDept._id,
		});

		const procurementStaffChain = [];

		let currentProc = procurementHead;
		procurementStaffChain.push({
			_id: currentProc._id,
			username: currentProc.username,
			email: currentProc.email,
			role: currentProc.role,
			department: currentProc.department,
		});
		seen.add(currentProc._id.toString());

		while (currentProc) {
			const next = await UserModel.findOne({
				reportsTo: currentProc._id,
				department: procurementDept._id,
			});

			if (!next || seen.has(next._id.toString())) break;

			procurementStaffChain.push({
				_id: next._id,
				username: next.username,
				email: next.email,
				role: next.role,
				department: next.department,
			});
			seen.add(next._id.toString());

			currentProc = next;
		}

		approvalChain.push(...procurementStaffChain.reverse());

		if (procurementHead && !seen.has(procurementHead._id.toString())) {
			approvalChain.push({
				_id: procurementHead._id,
				username: procurementHead.username,
				email: procurementHead.email,
				role: procurementHead.role,
				department: procurementHead.department,
			});
			seen.add(procurementHead._id.toString());
		}

		if (!seen.has(ceo._id.toString())) {
			approvalChain.push({
				_id: ceo._id,
				username: ceo.username,
				email: ceo.email,
				role: ceo.role,
				department: ceo.department,
			});
			seen.add(ceo._id.toString());
		}

		return res.status(StatusCodes.OK).json({
			success: true,
			approvalChain,
		});
	} catch (error) {
		console.error("Error in getApprovalChain:", error);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "Server error",
		});
	}
};

const getUsersReportingTo = async (req, res, next) => {
	try {
		const { userId } = req.params;

		const manager = await UserModel.findById(userId);

		if (!manager) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "Manager not found",
			});
		}

		const directReports = await UserModel.find({ reportsTo: manager._id });

		res.status(StatusCodes.OK).json({
			success: true,
			message: "Users reporting to the manager fetched successfully",
			data: directReports,
		});
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "Server error",
		});
	}
};

module.exports = {
	getApprovalChain,
	getUsersReportingTo,
};
