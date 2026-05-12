const pool = require("../config/db");

/**
 * Get my notifications
 * GET /api/notifications
 * Role: Any authenticated user
 */
const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 20, unread_only } = req.query;
        const offset = (page - 1) * limit;

        let query = `SELECT * FROM notifications WHERE user_id = $1`;
        const params = [userId];
        let paramIndex = 2;

        if (unread_only === "true") {
            query += ` AND is_read = false`;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Get unread count
        const unreadResult = await pool.query(
            "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false",
            [userId]
        );

        return res.status(200).json({
            success: true,
            data: result.rows,
            unreadCount: parseInt(unreadResult.rows[0].count),
            pagination: {
                currentPage: parseInt(page),
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Get notifications error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const notificationId = req.params.id;

        const result = await pool.query(
            `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
            [notificationId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        return res.status(200).json({ success: true, message: "Notification marked as read", data: result.rows[0] });
    } catch (error) {
        console.error("Mark notification read error:", error);
        return res.status(500).json({ success: false, message: "Failed to update notification" });
    }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;

        await pool.query(
            `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
            [userId]
        );

        return res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
        console.error("Mark all read error:", error);
        return res.status(500).json({ success: false, message: "Failed to update notifications" });
    }
};

/**
 * Register FCM token for push notifications
 * POST /api/notifications/register-token
 */
const registerFcmToken = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { token, device_type = "mobile" } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: "FCM token is required" });
        }

        await pool.query(
            `INSERT INTO fcm_tokens (user_id, token, device_type)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, token) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
            [userId, token, device_type]
        );

        return res.status(200).json({ success: true, message: "FCM token registered successfully" });
    } catch (error) {
        console.error("Register FCM token error:", error);
        return res.status(500).json({ success: false, message: "Failed to register FCM token" });
    }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.userId;
        const notificationId = req.params.id;

        const result = await pool.query(
            `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
            [notificationId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        return res.status(200).json({ success: true, message: "Notification deleted" });
    } catch (error) {
        console.error("Delete notification error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete notification" });
    }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, registerFcmToken, deleteNotification };
