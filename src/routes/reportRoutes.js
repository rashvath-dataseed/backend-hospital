const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { uploadReport, getMyReports } = require('../controllers/reportController');

// Upload report (PATIENT or DOCTOR)
router.post('/upload', authMiddleware, roleMiddleware("PATIENT", "DOCTOR"), upload.single('file'), uploadReport);

// Get own reports
router.get('/my-reports', authMiddleware, getMyReports);

module.exports = router;
