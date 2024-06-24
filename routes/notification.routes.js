const router = require('express').Router();

const { getNotifications, markAsRead } = require('../controllers/notification/notification.controller');
const {
    verifyToken
} = require("../middlewares/auth.middleware");

router.get("/notification", verifyToken, getNotifications);

router.get("/notification/read/:id?", verifyToken, markAsRead);

module.exports = router;

