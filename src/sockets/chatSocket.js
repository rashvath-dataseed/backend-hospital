const jwt = require("jsonwebtoken");
const pool = require("../config/db");

/**
 * Socket.IO Real-Time Chat Handler
 * Handles: connection, join room, send message, typing indicators, read receipts
 */
const initializeSocket = (io) => {
    // JWT authentication middleware for Socket.IO
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
            return next(new Error("Authentication required"));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (error) {
            return next(new Error("Invalid token"));
        }
    });

    // Track online users
    const onlineUsers = new Map(); // userId -> socketId

    io.on("connection", (socket) => {
        const userId = socket.user.userId;
        onlineUsers.set(userId, socket.id);

        console.log(`🔌 User ${userId} connected (socket: ${socket.id})`);

        // Broadcast online status
        io.emit("user_online", { userId });

        // ==========================================
        // JOIN CHAT ROOM
        // ==========================================
        socket.on("join_room", async (data) => {
            try {
                const { roomId } = data;

                // Verify user belongs to room
                const room = await pool.query(
                    "SELECT * FROM chat_rooms WHERE id = $1 AND (patient_id = $2 OR doctor_id = $2)",
                    [roomId, userId]
                );

                if (room.rows.length === 0) {
                    socket.emit("error", { message: "Access denied to this room" });
                    return;
                }

                socket.join(`room_${roomId}`);
                socket.emit("joined_room", { roomId });
            } catch (error) {
                console.error("Join room error:", error);
                socket.emit("error", { message: "Failed to join room" });
            }
        });

        // ==========================================
        // SEND MESSAGE
        // ==========================================
        socket.on("send_message", async (data) => {
            try {
                const { roomId, message, message_type = "text", file_url, file_name } = data;

                // Verify user belongs to room
                const room = await pool.query(
                    "SELECT * FROM chat_rooms WHERE id = $1 AND (patient_id = $2 OR doctor_id = $2)",
                    [roomId, userId]
                );

                if (room.rows.length === 0) {
                    socket.emit("error", { message: "Access denied" });
                    return;
                }

                // Save message to DB
                const result = await pool.query(
                    `INSERT INTO chat_messages (room_id, sender_id, message, message_type, file_url, file_name)
                    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                    [roomId, userId, message, message_type, file_url || null, file_name || null]
                );

                // Update room's last message
                await pool.query(
                    `UPDATE chat_rooms SET last_message = $1, last_message_at = CURRENT_TIMESTAMP WHERE id = $2`,
                    [message || "[File]", roomId]
                );

                // Get sender info
                const sender = await pool.query(
                    "SELECT full_name, profile_image FROM users WHERE id = $1",
                    [userId]
                );

                const messageData = {
                    ...result.rows[0],
                    sender_name: sender.rows[0].full_name,
                    sender_image: sender.rows[0].profile_image,
                };

                // Emit to room
                io.to(`room_${roomId}`).emit("new_message", messageData);

                // Notify the other user if they're not in the room
                const recipientId = room.rows[0].patient_id === userId
                    ? room.rows[0].doctor_id
                    : room.rows[0].patient_id;

                const recipientSocket = onlineUsers.get(recipientId);
                if (recipientSocket) {
                    io.to(recipientSocket).emit("message_notification", {
                        roomId,
                        message: messageData,
                    });
                }
            } catch (error) {
                console.error("Send message error:", error);
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // ==========================================
        // TYPING INDICATOR
        // ==========================================
        socket.on("typing_start", (data) => {
            const { roomId } = data;
            socket.to(`room_${roomId}`).emit("user_typing", {
                userId,
                roomId,
                isTyping: true,
            });
        });

        socket.on("typing_stop", (data) => {
            const { roomId } = data;
            socket.to(`room_${roomId}`).emit("user_typing", {
                userId,
                roomId,
                isTyping: false,
            });
        });

        // ==========================================
        // READ RECEIPTS
        // ==========================================
        socket.on("mark_read", async (data) => {
            try {
                const { roomId } = data;

                await pool.query(
                    `UPDATE chat_messages SET is_read = true 
                    WHERE room_id = $1 AND sender_id != $2 AND is_read = false`,
                    [roomId, userId]
                );

                socket.to(`room_${roomId}`).emit("messages_read", {
                    roomId,
                    readBy: userId,
                });
            } catch (error) {
                console.error("Mark read error:", error);
            }
        });

        // ==========================================
        // GET ONLINE STATUS
        // ==========================================
        socket.on("check_online", (data) => {
            const { userIds } = data;
            const statuses = {};
            userIds.forEach((uid) => {
                statuses[uid] = onlineUsers.has(uid);
            });
            socket.emit("online_status", statuses);
        });

        // ==========================================
        // DISCONNECT
        // ==========================================
        socket.on("disconnect", () => {
            onlineUsers.delete(userId);
            io.emit("user_offline", { userId });
            console.log(`🔌 User ${userId} disconnected`);
        });
    });
};

module.exports = initializeSocket;
