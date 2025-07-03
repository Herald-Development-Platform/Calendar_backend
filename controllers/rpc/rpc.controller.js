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

		const ceoEmail = procurementConfig?.ceoDetails?.email;
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
			return res
				.status(StatusCodes.NOT_FOUND)
				.json({ success: false, message: "Procurement department not found" });
		}

		const seen = new Set();
		const approvalChain = [];

		const addToChain = (user) => {
			const id = user._id.toString();
			if (!seen.has(id)) {
				approvalChain.push({
					_id: user._id,
					username: user.username,
					email: user.email,
					role: user.role,
					department: user.department,
					modifiedBy: user._id,
				});
				seen.add(id);
			}
		};

		// Traverse the reporting hierarchy up to CEO or procurement department
		let current = user.reportsTo;
		while (
			current &&
			current._id.toString() !== ceo._id.toString() &&
			current.department.toString() !== procurementDept._id.toString()
		) {
			addToChain(current);
			current = current.reportsTo;
		}

		// Add procurement staff chain
		const procurementHead = await UserModel.findOne({
			role: ROLES.DEPARTMENT_ADMIN,
			department: procurementDept._id,
		});

		if (procurementHead) {
			let currentProc = procurementHead;
			const procurementStaffChain = [];

			while (currentProc) {
				if (!seen.has(currentProc._id.toString())) {
					procurementStaffChain.push({
						_id: currentProc._id,
						username: currentProc.username,
						email: currentProc.email,
						role: currentProc.role,
						department: currentProc.department,
						modifiedBy: currentProc._id,
					});
					seen.add(currentProc._id.toString());
				}

				const next = await UserModel.findOne({
					reportsTo: currentProc._id,
					department: procurementDept._id,
				});
				if (!next || seen.has(next._id.toString())) break;

				currentProc = next;
			}

			approvalChain.push(...procurementStaffChain.reverse());
		}

		addToChain(ceo);
		return res.status(StatusCodes.OK).json({
			success: true,
			approvalChain,
		});
	} catch (error) {
		console.error("Error building approval chain:", error);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "Internal server error",
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
