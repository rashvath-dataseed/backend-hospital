const pool = require("../config/db");

/**
 * Create patient profile
 * POST /api/patients/create-profile
 * Role: PATIENT only
 */
const createProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Check if profile already exists
        const existing = await pool.query(
            "SELECT id FROM patients WHERE user_id = $1",
            [userId]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Patient profile already exists",
            });
        }

        const {
            gender,
            blood_group,
            date_of_birth,
            address,
            emergency_contact,
            allergies,
        } = req.body;

        const result = await pool.query(
            `INSERT INTO patients 
            (user_id, gender, blood_group, date_of_birth, address, emergency_contact, allergies)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [userId, gender, blood_group, date_of_birth, address, emergency_contact, allergies]
        );

        return res.status(201).json({
            success: true,
            message: "Patient profile created successfully",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Create patient profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create patient profile",
        });
    }
};

/**
 * Get own patient profile
 * GET /api/patients/my-profile
 * Role: PATIENT only
 */
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT p.*, u.full_name, u.email, u.phone
            FROM patients p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Patient profile not found. Please create your profile first.",
            });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Get patient profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch patient profile",
        });
    }
};

/**
 * Update own patient profile
 * PUT /api/patients/update-profile
 * Role: PATIENT only
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Check if profile exists
        const existing = await pool.query(
            "SELECT id FROM patients WHERE user_id = $1",
            [userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Patient profile not found. Please create your profile first.",
            });
        }

        const {
            gender,
            blood_group,
            date_of_birth,
            address,
            emergency_contact,
            allergies,
        } = req.body;

        const result = await pool.query(
            `UPDATE patients SET
                gender = COALESCE($1, gender),
                blood_group = COALESCE($2, blood_group),
                date_of_birth = COALESCE($3, date_of_birth),
                address = COALESCE($4, address),
                emergency_contact = COALESCE($5, emergency_contact),
                allergies = COALESCE($6, allergies)
            WHERE user_id = $7
            RETURNING *`,
            [gender, blood_group, date_of_birth, address, emergency_contact, allergies, userId]
        );

        return res.status(200).json({
            success: true,
            message: "Patient profile updated successfully",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Update patient profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update patient profile",
        });
    }
};

module.exports = {
    createProfile,
    getMyProfile,
    updateProfile,
};
