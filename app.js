/**
 * app.js — Express app without server.listen()
 * Used by supertest for integration tests.
 * server.js imports this and calls server.listen().
 */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

require('./src/config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/patients', require('./src/routes/patientRoutes'));
app.use('/api/doctors', require('./src/routes/doctorRoutes'));
app.use('/api/appointments', require('./src/routes/appointmentRoutes'));
app.use('/api/prescriptions', require('./src/routes/prescriptionRoutes'));
app.use('/api/reports', require('./src/routes/reportRoutes'));
app.use('/api/billing', require('./src/routes/billingRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/chat', require('./src/routes/chatRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Hospital Management System API', status: 'running' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
