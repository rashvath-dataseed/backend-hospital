const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { createPrescription, getPatientPrescriptions } = require("../controllers/prescriptionController");

// Doctor creates prescriptions
router.post("/create", authMiddleware, roleMiddleware("DOCTOR"), createPrescription);

// Patient/Doctor/Admin can view prescriptions
router.get("/patient/:id", authMiddleware, getPatientPrescriptions);

module.exports = router;
