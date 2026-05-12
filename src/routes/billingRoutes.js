const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { createBill, getMyBills } = require("../controllers/billingController");

// Admin/Doctor/Receptionist creates bills
router.post("/create", authMiddleware, roleMiddleware("ADMIN", "DOCTOR", "RECEPTIONIST"), createBill);

// Patient sees own bills, Admin/Receptionist sees all
router.get("/my-bills", authMiddleware, roleMiddleware("PATIENT", "ADMIN", "RECEPTIONIST"), getMyBills);

module.exports = router;
