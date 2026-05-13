const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  createProfile,
  getMyProfile,
  getAllDoctors,
  getDoctorById,
  updateProfile,
} = require("../controllers/doctorController");

// Doctor profile management (DOCTOR role only)
router.post("/create-profile", authMiddleware, roleMiddleware("DOCTOR"), createProfile);
router.get(
  "/my-profile",
  authMiddleware,
  roleMiddleware("DOCTOR"),
  getMyProfile,
);
router.put("/update-profile", authMiddleware, roleMiddleware("DOCTOR"), updateProfile);

// Public doctor listing (any authenticated user)
router.get("/", authMiddleware, getAllDoctors);
router.get("/:id", authMiddleware, getDoctorById);

module.exports = router;
