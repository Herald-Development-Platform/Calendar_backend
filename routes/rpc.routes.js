const { authenticateUserToken } = require('../controllers/auth/authRpc.controller');

const rpcRouter = require('express').Router();

rpcRouter.use((req, res, next) => {
    if (req.headers.rpcSecret !== process.env.RPC_SECRET) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access",
        });
    }
    next();
});


rpcRouter.post("/authenticateToken", authenticateUserToken);

module.exports = rpcRouter;
