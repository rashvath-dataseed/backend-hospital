const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
    bookAppointment,
    getMyAppointments,
    cancelAppointment,
    updateStatus,
    rescheduleAppointment,
} = require("../controllers/appointmentController");

// Patient/Receptionist books and cancels
router.post("/book", authMiddleware, roleMiddleware("PATIENT", "RECEPTIONIST"), bookAppointment);
router.put("/cancel/:id", authMiddleware, roleMiddleware("PATIENT", "RECEPTIONIST"), cancelAppointment);

// All roles can view their appointments
router.get("/my-appointments", authMiddleware, getMyAppointments);

// Doctor/Admin/Receptionist can update status
router.put("/update-status/:id", authMiddleware, roleMiddleware("DOCTOR", "ADMIN", "RECEPTIONIST"), updateStatus);

// Patient/Doctor/Receptionist can reschedule
router.put("/reschedule/:id", authMiddleware, roleMiddleware("PATIENT", "DOCTOR", "RECEPTIONIST"), rescheduleAppointment);

module.exports = router;
