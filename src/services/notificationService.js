const pool = require("../config/db");

/**
 * Create an in-app notification
 * Utility function used by other controllers
 */
const createNotification = async (userId, title, message, type = "GENERAL", referenceId = null, referenceType = null) => {
    try {
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, title, message, type, referenceId, referenceType]
        );
    } catch (error) {
        console.error("Create notification error:", error);
    }
};

module.exports = { createNotification };
