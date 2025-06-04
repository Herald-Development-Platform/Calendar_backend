const {
	authenticateUserToken,
	getApprovalChain,
	getUsersReportingTo,
} = require("../controllers/auth/authRpc.controller");

const rpcRouter = require("express").Router();

rpcRouter.use((req, res, next) => {
	// if (req.headers.rpc_secret !== process.env.RPC_SECRET) {
	//     return res.status(401).json({
	//         success: false,
	//         message: "Unauthorized access",
	//     });
	// }
	next();
});

rpcRouter.post("/authenticateToken", authenticateUserToken);
rpcRouter.get("/getApprovalChain/:userId", getApprovalChain);
rpcRouter.get("/getWhoReportsToMe/:userId", getUsersReportingTo);

module.exports = rpcRouter;
