const pool = require("../config/db");

// ============================
// USER MANAGEMENT
// ============================

/**
 * Get all users (with filters)
 * GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
    try {
        const { role, is_active, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `SELECT id, full_name, email, role, phone, is_active, profile_image, created_at FROM users`;
        const params = [];
        const conditions = [];
        let paramIndex = 1;

        if (role) {
            conditions.push(`role = $${paramIndex}`);
            params.push(role);
            paramIndex++;
        }

        if (is_active !== undefined) {
            conditions.push(`is_active = $${paramIndex}`);
            params.push(is_active === "true");
            paramIndex++;
        }

        if (search) {
            conditions.push(`(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(" AND ");
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Total count
        let countQuery = `SELECT COUNT(*) FROM users`;
        const countParams = [];
        const countConditions = [];
        let cpi = 1;

        if (role) { countConditions.push(`role = $${cpi}`); countParams.push(role); cpi++; }
        if (is_active !== undefined) { countConditions.push(`is_active = $${cpi}`); countParams.push(is_active === "true"); cpi++; }
        if (search) { countConditions.push(`(full_name ILIKE $${cpi} OR email ILIKE $${cpi})`); countParams.push(`%${search}%`); cpi++; }

        if (countConditions.length > 0) {
            countQuery += ` WHERE ` + countConditions.join(" AND ");
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);

        return res.status(200).json({
            success: true,
            data: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                totalUsers: totalCount,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Get all users error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
};

/**
 * Get single user by ID
 * GET /api/admin/users/:id
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT id, full_name, email, role, phone, is_active, profile_image, created_at FROM users WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error("Get user error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch user" });
    }
};

/**
 * Deactivate/Activate a user account
 * PUT /api/admin/users/:id/toggle-status
 */
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await pool.query("SELECT id, is_active FROM users WHERE id = $1", [id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const newStatus = !user.rows[0].is_active;
        const result = await pool.query(
            `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, full_name, email, role, is_active`,
            [newStatus, id]
        );

        return res.status(200).json({
            success: true,
            message: `User ${newStatus ? "activated" : "deactivated"} successfully`,
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Toggle user status error:", error);
        return res.status(500).json({ success: false, message: "Failed to update user status" });
    }
};

/**
 * Update user role
 * PUT /api/admin/users/:id/role
 */
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ["PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
        }

        const result = await pool.query(
            `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, email, role`,
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, message: "User role updated", data: result.rows[0] });
    } catch (error) {
        console.error("Update role error:", error);
        return res.status(500).json({ success: false, message: "Failed to update role" });
    }
};

// ============================
// ANALYTICS DASHBOARD
// ============================

/**
 * Get dashboard analytics
 * GET /api/admin/analytics
 */
const getDashboardAnalytics = async (req, res) => {
    try {
        // Total counts
        const totalUsers = await pool.query("SELECT COUNT(*) FROM users");
        const totalPatients = await pool.query("SELECT COUNT(*) FROM patients");
        const totalDoctors = await pool.query("SELECT COUNT(*) FROM doctors");
        const totalAppointments = await pool.query("SELECT COUNT(*) FROM appointments");

        // Appointments by status
        const appointmentsByStatus = await pool.query(
            `SELECT status, COUNT(*) as count FROM appointments GROUP BY status`
        );

        // Revenue
        const totalRevenue = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM billing WHERE payment_status = 'PAID'`
        );
        const pendingRevenue = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM billing WHERE payment_status = 'PENDING'`
        );

        // Recent activity (last 30 days)
        const recentAppointments = await pool.query(
            `SELECT COUNT(*) FROM appointments WHERE created_at >= NOW() - INTERVAL '30 days'`
        );
        const recentRegistrations = await pool.query(
            `SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days'`
        );

        // Users by role
        const usersByRole = await pool.query(
            `SELECT role, COUNT(*) as count FROM users GROUP BY role`
        );

        // Top doctors by appointments
        const topDoctors = await pool.query(
            `SELECT d.id, u.full_name, d.specialization, COUNT(a.id) as appointment_count
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            LEFT JOIN appointments a ON a.doctor_id = d.id
            GROUP BY d.id, u.full_name, d.specialization
            ORDER BY appointment_count DESC
            LIMIT 5`
        );

        // Monthly appointments trend (last 6 months)
        const monthlyTrend = await pool.query(
            `SELECT 
                TO_CHAR(appointment_date, 'YYYY-MM') as month,
                COUNT(*) as count
            FROM appointments
            WHERE appointment_date >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(appointment_date, 'YYYY-MM')
            ORDER BY month ASC`
        );

        return res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalUsers: parseInt(totalUsers.rows[0].count),
                    totalPatients: parseInt(totalPatients.rows[0].count),
                    totalDoctors: parseInt(totalDoctors.rows[0].count),
                    totalAppointments: parseInt(totalAppointments.rows[0].count),
                },
                revenue: {
                    totalPaid: parseFloat(totalRevenue.rows[0].total),
                    totalPending: parseFloat(pendingRevenue.rows[0].total),
                },
                recentActivity: {
                    appointmentsLast30Days: parseInt(recentAppointments.rows[0].count),
                    registrationsLast30Days: parseInt(recentRegistrations.rows[0].count),
                },
                appointmentsByStatus: appointmentsByStatus.rows,
                usersByRole: usersByRole.rows,
                topDoctors: topDoctors.rows,
                monthlyTrend: monthlyTrend.rows,
            },
        });
    } catch (error) {
        console.error("Get analytics error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
    }
};

// ============================
// DEPARTMENT MANAGEMENT
// ============================

/**
 * Create department
 * POST /api/admin/departments
 */
const createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ success: false, message: "Department name is required" });

        const result = await pool.query(
            `INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *`,
            [name, description || null]
        );

        return res.status(201).json({ success: true, message: "Department created", data: result.rows[0] });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ success: false, message: "Department already exists" });
        }
        console.error("Create department error:", error);
        return res.status(500).json({ success: false, message: "Failed to create department" });
    }
};

/**
 * Get all departments
 * GET /api/admin/departments
 */
const getDepartments = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM departments ORDER BY name ASC");
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Get departments error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch departments" });
    }
};

/**
 * Update department
 * PUT /api/admin/departments/:id
 */
const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_active } = req.body;

        const result = await pool.query(
            `UPDATE departments SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                is_active = COALESCE($3, is_active)
            WHERE id = $4 RETURNING *`,
            [name, description, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        return res.status(200).json({ success: true, message: "Department updated", data: result.rows[0] });
    } catch (error) {
        console.error("Update department error:", error);
        return res.status(500).json({ success: false, message: "Failed to update department" });
    }
};

// ============================
// ALL APPOINTMENTS (Admin view)
// ============================

/**
 * Get all appointments with full filtering
 * GET /api/admin/appointments
 */
const getAllAppointments = async (req, res) => {
    try {
        const { status, doctor_id, patient_id, date_from, date_to, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT a.*, 
                pu.full_name AS patient_name, pu.phone AS patient_phone,
                du.full_name AS doctor_name, d.specialization
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users pu ON p.user_id = pu.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users du ON d.user_id = du.id
        `;
        const params = [];
        const conditions = [];
        let pi = 1;

        if (status) { conditions.push(`a.status = $${pi}`); params.push(status); pi++; }
        if (doctor_id) { conditions.push(`a.doctor_id = $${pi}`); params.push(parseInt(doctor_id)); pi++; }
        if (patient_id) { conditions.push(`a.patient_id = $${pi}`); params.push(parseInt(patient_id)); pi++; }
        if (date_from) { conditions.push(`a.appointment_date >= $${pi}`); params.push(date_from); pi++; }
        if (date_to) { conditions.push(`a.appointment_date <= $${pi}`); params.push(date_to); pi++; }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(" AND ");
        }

        query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
        query += ` LIMIT $${pi} OFFSET $${pi + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            data: result.rows,
            pagination: { currentPage: parseInt(page), limit: parseInt(limit) },
        });
    } catch (error) {
        console.error("Admin get appointments error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch appointments" });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    toggleUserStatus,
    updateUserRole,
    getDashboardAnalytics,
    createDepartment,
    getDepartments,
    updateDepartment,
    getAllAppointments,
};
