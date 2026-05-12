const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const s3 = require('../config/s3');
const pool = require('../config/db');
const { generatePresignedUrl } = require('../utils/s3Utils');

/**
 * Upload a medical report to S3 and save metadata to DB
 * POST /api/reports/upload
 * Role: PATIENT, DOCTOR
 */
const uploadReport = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user.userId;
        const userRole = req.user.role;

        if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        // Determine patient_id
        let patientId;
        if (userRole === 'PATIENT') {
            const patient = await pool.query("SELECT id FROM patients WHERE user_id = $1", [userId]);
            if (patient.rows.length === 0) return res.status(404).json({ success: false, message: 'Patient profile not found' });
            patientId = patient.rows[0].id;
        } else if (userRole === 'DOCTOR') {
            patientId = req.body.patient_id;
            if (!patientId) return res.status(400).json({ success: false, message: 'patient_id is required for doctor uploads' });
        } else {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Upload to S3
        const ext = path.extname(file.originalname);
        const uniqueName = `${uuidv4()}${ext}`;
        const s3Key = `reports/${uniqueName}`;

        await s3.send(new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));

        const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

        // Save to DB
        const result = await pool.query(
            `INSERT INTO reports (patient_id, uploaded_by, file_name, file_url, file_type)
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [patientId, userId, file.originalname, fileUrl, file.mimetype]
        );

        return res.status(200).json({
            success: true,
            message: 'Report uploaded successfully',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ success: false, message: 'Failed to upload report' });
    }
};

/**
 * Get own medical reports
 * GET /api/reports/my-reports
 * Role: PATIENT (own), DOCTOR (assigned patients)
 */
const getMyReports = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        let result;

        if (userRole === 'PATIENT') {
            const patient = await pool.query("SELECT id FROM patients WHERE user_id = $1", [userId]);
            if (patient.rows.length === 0) return res.status(404).json({ success: false, message: 'Patient profile not found' });

            result = await pool.query(
                `SELECT r.*, u.full_name AS uploaded_by_name
                FROM reports r JOIN users u ON r.uploaded_by = u.id
                WHERE r.patient_id = $1 ORDER BY r.created_at DESC`,
                [patient.rows[0].id]
            );
        } else if (userRole === 'DOCTOR') {
            // Doctor sees reports of patients they have appointments with
            const doctor = await pool.query("SELECT id FROM doctors WHERE user_id = $1", [userId]);
            if (doctor.rows.length === 0) return res.status(404).json({ success: false, message: 'Doctor profile not found' });

            result = await pool.query(
                `SELECT DISTINCT r.*, u.full_name AS uploaded_by_name, pu.full_name AS patient_name
                FROM reports r
                JOIN users u ON r.uploaded_by = u.id
                JOIN patients p ON r.patient_id = p.id
                JOIN users pu ON p.user_id = pu.id
                JOIN appointments a ON a.patient_id = r.patient_id AND a.doctor_id = $1
                ORDER BY r.created_at DESC`,
                [doctor.rows[0].id]
            );
        } else {
            // Admin sees all
            result = await pool.query(
                `SELECT r.*, u.full_name AS uploaded_by_name, pu.full_name AS patient_name
                FROM reports r JOIN users u ON r.uploaded_by = u.id
                JOIN patients p ON r.patient_id = p.id JOIN users pu ON p.user_id = pu.id
                ORDER BY r.created_at DESC`
            );
        }

        // Generate signed URLs for each report
        const reportsWithSignedUrls = await Promise.all(
            result.rows.map(async (report) => ({
                ...report,
                file_url: await generatePresignedUrl(report.file_url)
            }))
        );

        return res.status(200).json({ success: true, data: reportsWithSignedUrls, count: result.rows.length });
    } catch (error) {
        console.error('Get reports error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch reports' });
    }
};

module.exports = { uploadReport, getMyReports };
