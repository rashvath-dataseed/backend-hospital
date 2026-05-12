const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
    getAllUsers,
    getUserById,
    toggleUserStatus,
    updateUserRole,
    getDashboardAnalytics,
    createDepartment,
    getDepartments,
    updateDepartment,
    getAllAppointments,
} = require("../controllers/adminController");

// All admin routes require ADMIN role
const adminOnly = [authMiddleware, roleMiddleware("ADMIN")];

// User management
router.get("/users", ...adminOnly, getAllUsers);
router.get("/users/:id", ...adminOnly, getUserById);
router.put("/users/:id/toggle-status", ...adminOnly, toggleUserStatus);
router.put("/users/:id/role", ...adminOnly, updateUserRole);

// Analytics
router.get("/analytics", ...adminOnly, getDashboardAnalytics);

// Department management
router.post("/departments", ...adminOnly, createDepartment);
router.get("/departments", ...adminOnly, getDepartments);
router.put("/departments/:id", ...adminOnly, updateDepartment);

// Admin appointment view
router.get("/appointments", ...adminOnly, getAllAppointments);

module.exports = router;
