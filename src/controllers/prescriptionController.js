const pool = require("../config/db");

const createPrescription = async (req, res) => {
    try {
        const userId = req.user.userId;
        const doctor = await pool.query("SELECT id FROM doctors WHERE user_id = $1", [userId]);
        if (doctor.rows.length === 0) return res.status(404).json({ success: false, message: "Doctor profile not found" });

        const doctorId = doctor.rows[0].id;
        const { appointment_id, patient_id, diagnosis, medicines, notes } = req.body;

        const patient = await pool.query("SELECT id FROM patients WHERE id = $1", [patient_id]);
        if (patient.rows.length === 0) return res.status(404).json({ success: false, message: "Patient not found" });

        if (appointment_id) {
            const appt = await pool.query(
                "SELECT id FROM appointments WHERE id = $1 AND doctor_id = $2 AND patient_id = $3",
                [appointment_id, doctorId, patient_id]
            );
            if (appt.rows.length === 0) return res.status(404).json({ success: false, message: "Appointment not found or mismatch" });
        }

        const result = await pool.query(
            `INSERT INTO prescriptions (appointment_id, doctor_id, patient_id, diagnosis, medicines, notes)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [appointment_id || null, doctorId, patient_id, diagnosis, JSON.stringify(medicines), notes]
        );

        return res.status(201).json({ success: true, message: "Prescription created successfully", data: result.rows[0] });
    } catch (error) {
        console.error("Create prescription error:", error);
        return res.status(500).json({ success: false, message: "Failed to create prescription" });
    }
};

const getPatientPrescriptions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const requestedPatientId = req.params.id;

        if (userRole === "PATIENT") {
            const patient = await pool.query("SELECT id FROM patients WHERE user_id = $1", [userId]);
            if (patient.rows.length === 0) return res.status(404).json({ success: false, message: "Patient profile not found" });
            if (parseInt(requestedPatientId) !== patient.rows[0].id) {
                return res.status(403).json({ success: false, message: "Access denied. You can only view your own prescriptions." });
            }
        }

        const result = await pool.query(
            `SELECT pr.*, du.full_name AS doctor_name, d.specialization, pu.full_name AS patient_name
            FROM prescriptions pr
            JOIN doctors d ON pr.doctor_id = d.id JOIN users du ON d.user_id = du.id
            JOIN patients p ON pr.patient_id = p.id JOIN users pu ON p.user_id = pu.id
            WHERE pr.patient_id = $1 ORDER BY pr.created_at DESC`,
            [requestedPatientId]
        );

        return res.status(200).json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        console.error("Get prescriptions error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch prescriptions" });
    }
};

module.exports = { createPrescription, getPatientPrescriptions };
