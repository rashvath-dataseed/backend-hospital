const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
    createOrGetRoom,
    getMyRooms,
    getRoomMessages,
    sendMessage,
} = require("../controllers/chatController");

// Only PATIENT and DOCTOR can use chat
router.post("/room", authMiddleware, roleMiddleware("PATIENT", "DOCTOR"), createOrGetRoom);
router.get("/rooms", authMiddleware, roleMiddleware("PATIENT", "DOCTOR"), getMyRooms);
router.get("/room/:roomId/messages", authMiddleware, roleMiddleware("PATIENT", "DOCTOR"), getRoomMessages);
router.post("/room/:roomId/message", authMiddleware, roleMiddleware("PATIENT", "DOCTOR"), sendMessage);

module.exports = router;
