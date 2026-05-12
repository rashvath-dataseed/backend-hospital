const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    registerFcmToken,
    deleteNotification,
} = require("../controllers/notificationController");

// All routes require authentication
router.get("/", authMiddleware, getMyNotifications);
router.put("/read-all", authMiddleware, markAllAsRead);
router.put("/:id/read", authMiddleware, markAsRead);
router.post("/register-token", authMiddleware, registerFcmToken);
router.delete("/:id", authMiddleware, deleteNotification);

module.exports = router;
