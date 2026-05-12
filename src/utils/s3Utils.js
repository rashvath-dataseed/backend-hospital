const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../config/s3");

/**
 * Generate a temporary signed URL for a private S3 object
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiration in seconds (default 1 hour)
 */
const generatePresignedUrl = async (key, expiresIn = 3600) => {
    try {
        // Handle cases where the full URL might be passed instead of just the key
        const s3Key = key.includes("amazonaws.com/") 
            ? key.split("amazonaws.com/")[1] 
            : key;

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
        });

        return await getSignedUrl(s3, command, { expiresIn });
    } catch (error) {
        console.error("Presigned URL generation failed:", error);
        return null;
    }
};

module.exports = { generatePresignedUrl };
