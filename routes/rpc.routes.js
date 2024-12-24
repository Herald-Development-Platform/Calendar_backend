const { authenticateUserToken } = require('../controllers/auth/authRpc.controller');

const rpcRouter = require('express').Router();

rpcRouter.use((req, res, next) => {
    console.log("RPC Request Received");
    console.log("RPC SECRET: ", req.headers.rpc_secret);
    if (req.headers.rpc_secret !== process.env.RPC_SECRET) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access",
        });
    }
    next();
});


rpcRouter.post("/authenticateToken", authenticateUserToken);

module.exports = rpcRouter;
