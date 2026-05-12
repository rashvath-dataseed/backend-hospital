-- ============================================================
-- Hospital Management System - Database Migrations
-- Run this script against your PostgreSQL database (hospital_db)
-- ============================================================

-- ============================================================
-- 1. PATIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    gender          VARCHAR(20),
    blood_group     VARCHAR(10),
    date_of_birth   DATE,
    address         TEXT,
    emergency_contact VARCHAR(100),
    allergies       TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);

-- ============================================================
-- 2. DOCTORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
    id                SERIAL PRIMARY KEY,
    user_id           INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialization    VARCHAR(100),
    experience_years  INTEGER DEFAULT 0,
    consultation_fee  DECIMAL(10, 2) DEFAULT 0.00,
    hospital_name     VARCHAR(200),
    qualification     VARCHAR(200),
    available_days    TEXT,          -- JSON string e.g. '["Monday","Tuesday"]'
    available_time    VARCHAR(100),  -- e.g. "09:00-17:00"
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);

-- ============================================================
-- 3. APPOINTMENTS TABLE
-- ============================================================
CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

CREATE TABLE IF NOT EXISTS appointments (
    id                SERIAL PRIMARY KEY,
    patient_id        INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id         INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date  DATE NOT NULL,
    appointment_time  TIME NOT NULL,
    reason            TEXT,
    status            appointment_status DEFAULT 'PENDING',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- ============================================================
-- 4. PRESCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id              SERIAL PRIMARY KEY,
    appointment_id  INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    doctor_id       INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    diagnosis       TEXT NOT NULL,
    medicines       JSONB NOT NULL DEFAULT '[]',
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment ON prescriptions(appointment_id);

-- ============================================================
-- 5. MEDICAL REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id            SERIAL PRIMARY KEY,
    patient_id    INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    uploaded_by   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name     VARCHAR(255) NOT NULL,
    file_url      TEXT NOT NULL,
    file_type     VARCHAR(50),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_patient ON reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_reports_uploaded_by ON reports(uploaded_by);

-- ============================================================
-- 6. BILLING TABLE
-- ============================================================
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED');

CREATE TABLE IF NOT EXISTS billing (
    id              SERIAL PRIMARY KEY,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id  INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    amount          DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_status  payment_status DEFAULT 'PENDING',
    invoice_url     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_billing_patient ON billing(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_appointment ON billing(appointment_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing(payment_status);
