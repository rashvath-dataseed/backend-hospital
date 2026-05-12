/**
 * Role-Based Authorization Middleware
 * Restricts access to routes based on user roles.
 * Usage: roleMiddleware('ADMIN', 'DOCTOR')
 */
const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user || !req.user.role) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
            }

            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required role(s): ${allowedRoles.join(", ")}`,
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Authorization check failed",
            });
        }
    };
};

module.exports = roleMiddleware;
