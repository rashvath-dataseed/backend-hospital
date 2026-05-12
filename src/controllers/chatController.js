const pool = require("../config/db");

/**
 * Create or get existing chat room between patient and doctor
 * POST /api/chat/room
 */
const createOrGetRoom = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { recipient_id } = req.body;

        if (!recipient_id) {
            return res.status(400).json({ success: false, message: "recipient_id is required" });
        }

        // Verify recipient exists
        const recipient = await pool.query("SELECT id, role FROM users WHERE id = $1", [recipient_id]);
        if (recipient.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Recipient not found" });
        }

        // Determine patient_id and doctor_id
        let patientUserId, doctorUserId;
        if (userRole === "PATIENT") {
            if (recipient.rows[0].role !== "DOCTOR") {
                return res.status(400).json({ success: false, message: "Patients can only chat with doctors" });
            }
            patientUserId = userId;
            doctorUserId = recipient_id;
        } else if (userRole === "DOCTOR") {
            if (recipient.rows[0].role !== "PATIENT") {
                return res.status(400).json({ success: false, message: "Doctors can only chat with patients" });
            }
            patientUserId = recipient_id;
            doctorUserId = userId;
        } else {
            return res.status(403).json({ success: false, message: "Only patients and doctors can use chat" });
        }

        // Check existing room
        let room = await pool.query(
            "SELECT * FROM chat_rooms WHERE patient_id = $1 AND doctor_id = $2",
            [patientUserId, doctorUserId]
        );

        if (room.rows.length === 0) {
            room = await pool.query(
                `INSERT INTO chat_rooms (patient_id, doctor_id) VALUES ($1, $2) RETURNING *`,
                [patientUserId, doctorUserId]
            );
        }

        // Get recipient info
        const recipientInfo = await pool.query(
            "SELECT id, full_name, email, role, profile_image FROM users WHERE id = $1",
            [recipient_id]
        );

        return res.status(200).json({
            success: true,
            data: {
                room: room.rows[0],
                recipient: recipientInfo.rows[0],
            },
        });
    } catch (error) {
        console.error("Create/get room error:", error);
        return res.status(500).json({ success: false, message: "Failed to create/get chat room" });
    }
};

/**
 * Get my chat rooms
 * GET /api/chat/rooms
 */
const getMyRooms = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT cr.*,
                pu.full_name AS patient_name, pu.profile_image AS patient_image,
                du.full_name AS doctor_name, du.profile_image AS doctor_image,
                (SELECT COUNT(*) FROM chat_messages cm 
                 WHERE cm.room_id = cr.id AND cm.sender_id != $1 AND cm.is_read = false) AS unread_count
            FROM chat_rooms cr
            JOIN users pu ON cr.patient_id = pu.id
            JOIN users du ON cr.doctor_id = du.id
            WHERE cr.patient_id = $1 OR cr.doctor_id = $1
            ORDER BY COALESCE(cr.last_message_at, cr.created_at) DESC`,
            [userId]
        );

        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Get rooms error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch chat rooms" });
    }
};

/**
 * Get messages for a chat room
 * GET /api/chat/room/:roomId/messages
 */
const getRoomMessages = async (req, res) => {
    try {
        const userId = req.user.userId;
        const roomId = req.params.roomId;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        // Verify user belongs to this room
        const room = await pool.query(
            "SELECT * FROM chat_rooms WHERE id = $1 AND (patient_id = $2 OR doctor_id = $2)",
            [roomId, userId]
        );

        if (room.rows.length === 0) {
            return res.status(403).json({ success: false, message: "Access denied to this chat room" });
        }

        // Mark messages as read
        await pool.query(
            `UPDATE chat_messages SET is_read = true 
            WHERE room_id = $1 AND sender_id != $2 AND is_read = false`,
            [roomId, userId]
        );

        const result = await pool.query(
            `SELECT cm.*, u.full_name AS sender_name, u.profile_image AS sender_image
            FROM chat_messages cm
            JOIN users u ON cm.sender_id = u.id
            WHERE cm.room_id = $1
            ORDER BY cm.created_at DESC
            LIMIT $2 OFFSET $3`,
            [roomId, parseInt(limit), parseInt(offset)]
        );

        return res.status(200).json({
            success: true,
            data: result.rows,
            pagination: { currentPage: parseInt(page), limit: parseInt(limit) },
        });
    } catch (error) {
        console.error("Get messages error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch messages" });
    }
};

/**
 * Send a message (REST fallback — primary is Socket.IO)
 * POST /api/chat/room/:roomId/message
 */
const sendMessage = async (req, res) => {
    try {
        const userId = req.user.userId;
        const roomId = req.params.roomId;
        const { message, message_type = "text", file_url, file_name } = req.body;

        // Verify user belongs to this room
        const room = await pool.query(
            "SELECT * FROM chat_rooms WHERE id = $1 AND (patient_id = $2 OR doctor_id = $2)",
            [roomId, userId]
        );

        if (room.rows.length === 0) {
            return res.status(403).json({ success: false, message: "Access denied to this chat room" });
        }

        const result = await pool.query(
            `INSERT INTO chat_messages (room_id, sender_id, message, message_type, file_url, file_name)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [roomId, userId, message, message_type, file_url || null, file_name || null]
        );

        // Update last message in room
        await pool.query(
            `UPDATE chat_rooms SET last_message = $1, last_message_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [message || "[File]", roomId]
        );

        return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error("Send message error:", error);
        return res.status(500).json({ success: false, message: "Failed to send message" });
    }
};

module.exports = { createOrGetRoom, getMyRooms, getRoomMessages, sendMessage };
