const router = require('express').Router();

const { getNotifications } = require('../controllers/notification/notification.controller');
const {
    verifyToken
} = require("../middlewares/auth.middleware");

router.get("/notification", verifyToken, getNotifications);

module.exports = router;

