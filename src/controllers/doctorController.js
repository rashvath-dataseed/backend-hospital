const pool = require("../config/db");

/**
 * Create doctor profile
 * POST /api/doctors/create-profile
 * Role: DOCTOR only
 */
const createProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Check if profile already exists
        const existing = await pool.query(
            "SELECT id FROM doctors WHERE user_id = $1",
            [userId]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Doctor profile already exists",
            });
        }

        const {
            specialization,
            experience_years,
            consultation_fee,
            hospital_name,
            qualification,
            available_days,
            available_time,
        } = req.body;

        const result = await pool.query(
            `INSERT INTO doctors 
            (user_id, specialization, experience_years, consultation_fee, hospital_name, qualification, available_days, available_time)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                userId,
                specialization,
                experience_years,
                consultation_fee,
                hospital_name,
                qualification,
                JSON.stringify(available_days),
                available_time,
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Doctor profile created successfully",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Create doctor profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create doctor profile",
        });
    }
};

/**
 * Get all doctors (public listing)
 * GET /api/doctors
 * Role: Any authenticated user
 */
const getAllDoctors = async (req, res) => {
    try {
        const { specialization, name, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT d.*, u.full_name, u.email, u.phone
            FROM doctors d
            JOIN users u ON d.user_id = u.id
        `;
        const params = [];
        let paramIndex = 1;
        const conditions = [];

        if (specialization) {
            conditions.push(`d.specialization ILIKE $${paramIndex}`);
            params.push(`%${specialization}%`);
            paramIndex++;
        }

        if (name) {
          conditions.push(`u.full_name ILIKE $${paramIndex}`);
          params.push(`%${name}%`);
          paramIndex++;
        }

        if (conditions.length > 0) {
          query += ` WHERE ` + conditions.join(` AND `);
        }

        query += ` ORDER BY d.created_at DESC`;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Get total count
        let countQuery =
          "SELECT COUNT(*) FROM doctors d JOIN users u ON d.user_id = u.id";
        const countParams = [];
        let countIndex = 1;
        const countConditions = [];
        if (specialization) {
          countConditions.push(`d.specialization ILIKE $${countIndex}`);
          countParams.push(`%${specialization}%`);
          countIndex++;
        }
        if (name) {
          countConditions.push(`u.full_name ILIKE $${countIndex}`);
          countParams.push(`%${name}%`);
          countIndex++;
        }
        if (countConditions.length > 0)
          countQuery += " WHERE " + countConditions.join(" AND ");
        const countResult = await pool.query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);

        return res.status(200).json({
            success: true,
            data: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                totalDoctors: totalCount,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Get all doctors error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch doctors",
        });
    }
};

/**
 * Get own doctor profile
 * GET /api/doctors/my-profile
 * Role: DOCTOR only
 */
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT d.*, u.full_name, u.email, u.phone
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Get my profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch doctor profile",
        });
    }
};

/**
 * Get single doctor by ID
 * GET /api/doctors/:id
 * Role: Any authenticated user
 */
const getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT d.*, u.full_name, u.email, u.phone
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Get doctor by ID error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch doctor",
        });
    }
};

/**
 * Update own doctor profile
 * PUT /api/doctors/update-profile
 * Role: DOCTOR only
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Check if profile exists
        const existing = await pool.query(
            "SELECT id FROM doctors WHERE user_id = $1",
            [userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found. Please create your profile first.",
            });
        }

        const {
            specialization,
            experience_years,
            consultation_fee,
            hospital_name,
            qualification,
            available_days,
            available_time,
        } = req.body;

        const result = await pool.query(
            `UPDATE doctors SET
                specialization = COALESCE($1, specialization),
                experience_years = COALESCE($2, experience_years),
                consultation_fee = COALESCE($3, consultation_fee),
                hospital_name = COALESCE($4, hospital_name),
                qualification = COALESCE($5, qualification),
                available_days = COALESCE($6, available_days),
                available_time = COALESCE($7, available_time)
            WHERE user_id = $8
            RETURNING *`,
            [
                specialization,
                experience_years,
                consultation_fee,
                hospital_name,
                qualification,
                available_days ? JSON.stringify(available_days) : null,
                available_time,
                userId,
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Doctor profile updated successfully",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Update doctor profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update doctor profile",
        });
    }
};

module.exports = {
  createProfile,
  getMyProfile,
  getAllDoctors,
  getDoctorById,
  updateProfile,
};
