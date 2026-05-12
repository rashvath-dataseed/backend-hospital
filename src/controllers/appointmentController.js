const pool = require("../config/db");
const { createNotification } = require("../services/notificationService");

/**
 * Book an appointment
 * POST /api/appointments/book
 * Role: PATIENT, RECEPTIONIST
 */
const bookAppointment = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        let patientId;

        if (userRole === "RECEPTIONIST") {
            // Receptionist books on behalf of a patient
            const { patient_id } = req.body;
            if (!patient_id) return res.status(400).json({ success: false, message: "patient_id is required for receptionist booking" });
            const p = await pool.query("SELECT id FROM patients WHERE id = $1", [patient_id]);
            if (p.rows.length === 0) return res.status(404).json({ success: false, message: "Patient not found" });
            patientId = patient_id;
        } else {
            // Patient books own appointment
            const patient = await pool.query("SELECT id FROM patients WHERE user_id = $1", [userId]);
            if (patient.rows.length === 0) return res.status(404).json({ success: false, message: "Please create your patient profile first" });
            patientId = patient.rows[0].id;
        }

        const { doctor_id, appointment_date, appointment_time, reason } = req.body;

        // Check if doctor exists
        const doctor = await pool.query("SELECT d.id, u.full_name, d.user_id FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1", [doctor_id]);
        if (doctor.rows.length === 0) return res.status(404).json({ success: false, message: "Doctor not found" });

        // Check for duplicate appointment (same doctor, date, time)
        const duplicate = await pool.query(
            `SELECT id FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status NOT IN ('CANCELLED')`,
            [doctor_id, appointment_date, appointment_time]
        );
        if (duplicate.rows.length > 0) return res.status(409).json({ success: false, message: "This time slot is already booked with the selected doctor" });

        const result = await pool.query(
            `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [patientId, doctor_id, appointment_date, appointment_time, reason]
        );

        // Notify doctor about new appointment
        await createNotification(
            doctor.rows[0].user_id,
            "New Appointment",
            `You have a new appointment on ${appointment_date} at ${appointment_time}`,
            "APPOINTMENT",
            result.rows[0].id,
            "appointment"
        );

        // Notify patient (if booked by receptionist)
        if (userRole === "RECEPTIONIST") {
            const patientUser = await pool.query("SELECT user_id FROM patients WHERE id = $1", [patientId]);
            if (patientUser.rows.length > 0) {
                await createNotification(
                    patientUser.rows[0].user_id,
                    "Appointment Booked",
                    `Your appointment with Dr. ${doctor.rows[0].full_name} has been booked for ${appointment_date} at ${appointment_time}`,
                    "APPOINTMENT",
                    result.rows[0].id,
                    "appointment"
                );
            }
        }

        return res.status(201).json({ success: true, message: "Appointment booked successfully", data: result.rows[0] });
    } catch (error) {
        console.error("Book appointment error:", error);
        return res.status(500).json({ success: false, message: "Failed to book appointment" });
    }
};

/**
 * Get my appointments
 * GET /api/appointments/my-appointments
 * Role: PATIENT, DOCTOR, ADMIN, RECEPTIONIST
 */
const getMyAppointments = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { status, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = "";
        let params = [];
        let paramIndex = 1;

        const baseSelect = `
            SELECT a.*, 
                pu.full_name AS patient_name, pu.phone AS patient_phone,
                du.full_name AS doctor_name,
                d.specialization
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users pu ON p.user_id = pu.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users du ON d.user_id = du.id
        `;

        if (userRole === "ADMIN" || userRole === "RECEPTIONIST") {
            query = baseSelect;
            if (status) {
                query += ` WHERE a.status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }
        } else if (userRole === "DOCTOR") {
            const doctor = await pool.query("SELECT id FROM doctors WHERE user_id = $1", [userId]);
            if (doctor.rows.length === 0) return res.status(404).json({ success: false, message: "Doctor profile not found" });

            query = baseSelect + ` WHERE a.doctor_id = $${paramIndex}`;
            params.push(doctor.rows[0].id);
            paramIndex++;
            if (status) { query += ` AND a.status = $${paramIndex}`; params.push(status); paramIndex++; }
        } else {
            const patient = await pool.query("SELECT id FROM patients WHERE user_id = $1", [userId]);
            if (patient.rows.length === 0) return res.status(404).json({ success: false, message: "Patient profile not found" });

            query = baseSelect + ` WHERE a.patient_id = $${paramIndex}`;
            params.push(patient.rows[0].id);
            paramIndex++;
            if (status) { query += ` AND a.status = $${paramIndex}`; params.push(status); paramIndex++; }
        }

        query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            data: result.rows,
            pagination: { currentPage: parseInt(page), limit: parseInt(limit) },
        });
    } catch (error) {
        console.error("Get appointments error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch appointments" });
    }
};

/**
 * Cancel own appointment
 * PUT /api/appointments/cancel/:id
 * Role: PATIENT, RECEPTIONIST
 */
const cancelAppointment = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const appointmentId = req.params.id;

        let appointment;

        if (userRole === "RECEPTIONIST") {
            appointment = await pool.query("SELECT * FROM appointments WHERE id = $1", [appointmentId]);
        } else {
            const patient = await pool.query("SELECT id FROM patients WHERE user_id = $1", [userId]);
            if (patient.rows.length === 0) return res.status(404).json({ success: false, message: "Patient profile not found" });
            appointment = await pool.query("SELECT * FROM appointments WHERE id = $1 AND patient_id = $2", [appointmentId, patient.rows[0].id]);
        }

        if (appointment.rows.length === 0) return res.status(404).json({ success: false, message: "Appointment not found or does not belong to you" });
        if (appointment.rows[0].status === "CANCELLED") return res.status(400).json({ success: false, message: "Appointment is already cancelled" });
        if (appointment.rows[0].status === "COMPLETED") return res.status(400).json({ success: false, message: "Cannot cancel a completed appointment" });

        const result = await pool.query(`UPDATE appointments SET status = 'CANCELLED' WHERE id = $1 RETURNING *`, [appointmentId]);

        // Notify doctor about cancellation
        const doctorUser = await pool.query("SELECT user_id FROM doctors WHERE id = $1", [appointment.rows[0].doctor_id]);
        if (doctorUser.rows.length > 0) {
            await createNotification(
                doctorUser.rows[0].user_id,
                "Appointment Cancelled",
                `An appointment scheduled for ${appointment.rows[0].appointment_date} has been cancelled`,
                "APPOINTMENT",
                appointmentId,
                "appointment"
            );
        }

        return res.status(200).json({ success: true, message: "Appointment cancelled successfully", data: result.rows[0] });
    } catch (error) {
        console.error("Cancel appointment error:", error);
        return res.status(500).json({ success: false, message: "Failed to cancel appointment" });
    }
};

/**
 * Update appointment status
 * PUT /api/appointments/update-status/:id
 * Role: DOCTOR, ADMIN, RECEPTIONIST
 */
const updateStatus = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const appointmentId = req.params.id;
        const { status } = req.body;

        const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        }

        let appointment;

        if (userRole === "ADMIN" || userRole === "RECEPTIONIST") {
            appointment = await pool.query("SELECT * FROM appointments WHERE id = $1", [appointmentId]);
        } else if (userRole === "DOCTOR") {
            const doctor = await pool.query("SELECT id FROM doctors WHERE user_id = $1", [userId]);
            if (doctor.rows.length === 0) return res.status(404).json({ success: false, message: "Doctor profile not found" });
            appointment = await pool.query("SELECT * FROM appointments WHERE id = $1 AND doctor_id = $2", [appointmentId, doctor.rows[0].id]);
        }

        if (!appointment || appointment.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Appointment not found or access denied" });
        }

        const result = await pool.query(`UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *`, [status, appointmentId]);

        // Notify patient about status update
        const patientUser = await pool.query("SELECT user_id FROM patients WHERE id = $1", [appointment.rows[0].patient_id]);
        if (patientUser.rows.length > 0) {
            const statusMessages = {
                CONFIRMED: "Your appointment has been confirmed",
                CANCELLED: "Your appointment has been cancelled",
                COMPLETED: "Your appointment has been marked as completed",
                PENDING: "Your appointment status has been updated to pending",
            };
            await createNotification(
                patientUser.rows[0].user_id,
                `Appointment ${status}`,
                statusMessages[status],
                "APPOINTMENT",
                appointmentId,
                "appointment"
            );
        }

        return res.status(200).json({ success: true, message: `Appointment status updated to ${status}`, data: result.rows[0] });
    } catch (error) {
        console.error("Update appointment status error:", error);
        return res.status(500).json({ success: false, message: "Failed to update appointment status" });
    }
};

/**
 * Reschedule appointment
 * PUT /api/appointments/reschedule/:id
 * Role: PATIENT, DOCTOR, RECEPTIONIST
 */
const rescheduleAppointment = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const appointmentId = req.params.id;
        const { appointment_date, appointment_time } = req.body;

        if (!appointment_date || !appointment_time) {
            return res.status(400).json({ success: false, message: "appointment_date and appointment_time are required" });
        }

        let appointment;

        if (userRole === "RECEPTIONIST") {
            appointment = await pool.query("SELECT * FROM appointments WHERE id = $1", [appointmentId]);
        } else if (userRole === "DOCTOR") {
            const doctor = await pool.query("SELECT id FROM doctors WHERE user_id = $1", [userId]);
            if (doctor.rows.length === 0) return res.status(404).json({ success: false, message: "Doctor profile not found" });
            appointment = await pool.query("SELECT * FROM appointments WHERE id = $1 AND doctor_id = $2", [appointmentId, doctor.rows[0].id]);
        } else {
            const patient = await pool.query("SELECT id FROM patients WHERE user_id = $1", [userId]);
            if (patient.rows.length === 0) return res.status(404).json({ success: false, message: "Patient profile not found" });
            appointment = await pool.query("SELECT * FROM appointments WHERE id = $1 AND patient_id = $2", [appointmentId, patient.rows[0].id]);
        }

        if (!appointment || appointment.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Appointment not found or access denied" });
        }

        if (["CANCELLED", "COMPLETED"].includes(appointment.rows[0].status)) {
            return res.status(400).json({ success: false, message: `Cannot reschedule a ${appointment.rows[0].status.toLowerCase()} appointment` });
        }

        // Check for slot conflict
        const duplicate = await pool.query(
            `SELECT id FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status NOT IN ('CANCELLED') AND id != $4`,
            [appointment.rows[0].doctor_id, appointment_date, appointment_time, appointmentId]
        );
        if (duplicate.rows.length > 0) return res.status(409).json({ success: false, message: "This time slot is already booked" });

        const result = await pool.query(
            `UPDATE appointments SET appointment_date = $1, appointment_time = $2, status = 'PENDING' WHERE id = $3 RETURNING *`,
            [appointment_date, appointment_time, appointmentId]
        );

        // Notify both parties
        const patientUser = await pool.query("SELECT user_id FROM patients WHERE id = $1", [appointment.rows[0].patient_id]);
        const doctorUser = await pool.query("SELECT user_id FROM doctors WHERE id = $1", [appointment.rows[0].doctor_id]);

        if (patientUser.rows.length > 0 && patientUser.rows[0].user_id !== userId) {
            await createNotification(patientUser.rows[0].user_id, "Appointment Rescheduled",
                `Your appointment has been rescheduled to ${appointment_date} at ${appointment_time}`,
                "APPOINTMENT", appointmentId, "appointment");
        }
        if (doctorUser.rows.length > 0 && doctorUser.rows[0].user_id !== userId) {
            await createNotification(doctorUser.rows[0].user_id, "Appointment Rescheduled",
                `An appointment has been rescheduled to ${appointment_date} at ${appointment_time}`,
                "APPOINTMENT", appointmentId, "appointment");
        }

        return res.status(200).json({ success: true, message: "Appointment rescheduled successfully", data: result.rows[0] });
    } catch (error) {
        console.error("Reschedule appointment error:", error);
        return res.status(500).json({ success: false, message: "Failed to reschedule appointment" });
    }
};

module.exports = { bookAppointment, getMyAppointments, cancelAppointment, updateStatus, rescheduleAppointment };
