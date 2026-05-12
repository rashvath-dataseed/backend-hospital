const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

require("./src/config/db");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Initialize Socket.IO chat handlers
const initializeSocket = require("./src/sockets/chatSocket");
initializeSocket(io);

// Make io accessible to controllers if needed
app.set("io", io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const patientRoutes = require("./src/routes/patientRoutes");
const doctorRoutes = require("./src/routes/doctorRoutes");
const appointmentRoutes = require("./src/routes/appointmentRoutes");
const prescriptionRoutes = require("./src/routes/prescriptionRoutes");
const reportRoutes = require('./src/routes/reportRoutes');
const billingRoutes = require("./src/routes/billingRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const adminRoutes = require("./src/routes/adminRoutes");

// Health check
app.get('/', (req, res) => {
    res.json({
        message: 'Hospital Management System API',
        version: '3.0.0',
        modules: [
            'auth', 'patients', 'doctors',
            'appointments', 'prescriptions',
            'reports', 'billing',
            'notifications', 'chat', 'admin'
        ],
        status: 'running',
    });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use('/api/reports', reportRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
});

// Start server (use server.listen for Socket.IO instead of app.listen)
server.listen(PORT, () => {
    console.log(`🏥 Hospital Management System API running on port ${PORT}`);
    console.log(`📋 Modules: auth, patients, doctors, appointments, prescriptions, reports, billing, notifications, chat, admin`);
    console.log(`🔌 Socket.IO ready for real-time chat`);
});