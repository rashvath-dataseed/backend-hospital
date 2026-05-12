const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { createProfile, getMyProfile, updateProfile } = require("../controllers/patientController");

// All routes require authentication + PATIENT role
router.post("/create-profile", authMiddleware, roleMiddleware("PATIENT"), createProfile);
router.get("/my-profile", authMiddleware, roleMiddleware("PATIENT"), getMyProfile);
router.put("/update-profile", authMiddleware, roleMiddleware("PATIENT"), updateProfile);

module.exports = router;
