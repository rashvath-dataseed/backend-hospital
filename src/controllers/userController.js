const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const s3 = require('../config/s3');
const pool = require('../config/db');

/**
 * Upload Profile Image
 * POST /api/auth/profile-image
 */
const uploadProfileImage = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user.userId;
        const userRole = req.user.role;

        if (!file) return res.status(400).json({ success: false, message: 'No image uploaded' });

        const ext = path.extname(file.originalname);
        const uniqueName = `profiles/${uuidv4()}${ext}`;

        await s3.send(new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: uniqueName,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));

        const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueName}`;

        // Update users table
        await pool.query("UPDATE users SET profile_image = $1 WHERE id = $2", [imageUrl, userId]);

        // Update specific role tables if needed (BRD mentions profile image in patient/doctor profiles)
        if (userRole === "PATIENT") {
            await pool.query("UPDATE patients SET profile_image = $1 WHERE user_id = $2", [imageUrl, userId]);
        } else if (userRole === "DOCTOR") {
            await pool.query("UPDATE doctors SET profile_image = $1 WHERE user_id = $2", [imageUrl, userId]);
        }

        return res.status(200).json({
            success: true,
            message: 'Profile image updated successfully',
            data: { profile_image: imageUrl }
        });
    } catch (error) {
        console.error('Profile image upload error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update profile image' });
    }
};

module.exports = { uploadProfileImage };
