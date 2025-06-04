const ACCESS_SECRET = process.env.JWT_SECRET;
const jwt = require("jsonwebtoken");
const UserModel = require("../../models/user.model");
const { StatusCodes } = require("http-status-codes");

const authenticateUserToken = async (req, res, next) => {
	let token = req.body.token;
	if (!token) {
		return res.status(StatusCodes.FORBIDDEN).json({
			success: false,
			message: "Authentication Token Not Provided!",
		});
	}
	let id;
	token = token.trim();
	try {
		const { id: userID } = jwt.verify(token, ACCESS_SECRET);
		id = userID?.trim();
	} catch (e) {
		return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Invalid Token!" });
	}
	if (!id) {
		return res.status(401).json({
			success: false,
			message: "Invalid Token!",
		});
	}
	let user = await UserModel.findById(id).populate("department");

	if (!user) {
		return res.status(StatusCodes.UNAUTHORIZED).json({
			success: false,
			message: "Authenticated user account not found!",
		});
	}

	return res.status(StatusCodes.OK).json({
		success: true,
		message: "Authenticated!",
		user,
	});
};

const getApprovalChain = async (req, res) => {
	try {
		const { userId } = req.params;

		let currentUser = await UserModel.findById(userId).populate("reportsTo");
		if (!currentUser) {
			return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "User not found" });
		}

		const approvalChain = [];

		// approvalChain.push({
		// 	_id: currentUser._id,
		// 	username: currentUser.username,
		// 	email: currentUser.email,
		// 	role: currentUser.role,
		// 	department: currentUser.department,
		// });

		while (currentUser.reportsTo) {
			const approver = currentUser.reportsTo;

			approvalChain.push({
				_id: approver._id,
				username: approver.username,
				email: approver.email,
				role: approver.role,
				department: approver.department,
			});

			currentUser = await UserModel.findById(approver._id).populate("reportsTo");
		}

		return res.status(StatusCodes.OK).json({
			success: true,
			message: "Approval chain fetched successfully",
			data: {
				count: approvalChain.length,
				approvers: approvalChain,
			},
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: "Server error" });
	}
};

const getUsersReportingTo = async (req, res, next) => {
	try {
		const { userId } = req.params;

		const manager = await UserModel.findById(userId);
		console.log("Manager: ", manager);
		

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
	authenticateUserToken,
	getApprovalChain,
	getUsersReportingTo,
};
