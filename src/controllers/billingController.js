const pool = require("../config/db");

/**
 * Create a billing record
 * POST /api/billing/create
 * Role: ADMIN, DOCTOR
 */
const createBill = async (req, res) => {
    try {
        const { patient_id, appointment_id, amount, invoice_url } = req.body;

        // Validate patient exists
        const patient = await pool.query("SELECT id FROM patients WHERE id = $1", [patient_id]);
        if (patient.rows.length === 0) return res.status(404).json({ success: false, message: "Patient not found" });

        // Validate appointment if provided
        if (appointment_id) {
            const appt = await pool.query("SELECT id FROM appointments WHERE id = $1 AND patient_id = $2", [appointment_id, patient_id]);
            if (appt.rows.length === 0) return res.status(404).json({ success: false, message: "Appointment not found or mismatch" });
        }

        const result = await pool.query(
            `INSERT INTO billing (patient_id, appointment_id, amount, invoice_url)
            VALUES ($1, $2, $3, $4) RETURNING *`,
            [patient_id, appointment_id || null, amount, invoice_url || null]
        );

        return res.status(201).json({ success: true, message: "Bill created successfully", data: result.rows[0] });
    } catch (error) {
        console.error("Create bill error:", error);
        return res.status(500).json({ success: false, message: "Failed to create bill" });
    }
};

/**
 * Get bills
 * GET /api/billing/my-bills
 * Role: PATIENT (own), ADMIN (all)
 */
const getMyBills = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        let result;

        if (userRole === "ADMIN" || userRole === "RECEPTIONIST") {
            result = await pool.query(
                `SELECT b.*, pu.full_name AS patient_name
                FROM billing b
                JOIN patients p ON b.patient_id = p.id
                JOIN users pu ON p.user_id = pu.id
                ORDER BY b.created_at DESC`
            );
        } else {
            const patient = await pool.query("SELECT id FROM patients WHERE user_id = $1", [userId]);
            if (patient.rows.length === 0) return res.status(404).json({ success: false, message: "Patient profile not found" });

            result = await pool.query(
                `SELECT b.* FROM billing b WHERE b.patient_id = $1 ORDER BY b.created_at DESC`,
                [patient.rows[0].id]
            );
        }

        return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        console.error("Get bills error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch bills" });
    }
};

module.exports = { createBill, getMyBills };
