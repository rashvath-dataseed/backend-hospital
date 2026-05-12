const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Verify user still exists and is active
        const pool = require("../config/db");
        const userCheck = await pool.query("SELECT is_active FROM users WHERE id = $1", [decoded.userId]);
        
        if (userCheck.rows.length === 0 || userCheck.rows[0].is_active === false) {
            return res.status(401).json({
                success: false,
                message: "User account is inactive or no longer exists",
            });
        }

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid token",
        });
    }
};

module.exports = authMiddleware;