-- ============================================================
-- Hospital Management System - Migration V2
-- New modules: Notifications, Chat, Admin Management
-- Run AFTER migrations.sql
-- ============================================================

-- ============================================================
-- Add is_active and profile_image to users table
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- ============================================================
-- Add profile_image to patients table
-- ============================================================
ALTER TABLE patients ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- ============================================================
-- Add profile_image and bio to doctors table
-- ============================================================
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS bio TEXT;

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    type            VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    reference_id    INTEGER,
    reference_type  VARCHAR(50),
    is_read         BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================================
-- FCM TOKENS TABLE (for push notifications)
-- ============================================================
CREATE TABLE IF NOT EXISTS fcm_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT NOT NULL,
    device_type VARCHAR(20) DEFAULT 'mobile',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fcm_tokens_unique ON fcm_tokens(user_id, token);

-- ============================================================
-- CHAT ROOMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_rooms (
    id            SERIAL PRIMARY KEY,
    patient_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message  TEXT,
    last_message_at TIMESTAMP,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_patient ON chat_rooms(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_doctor ON chat_rooms(doctor_id);

-- ============================================================
-- CHAT MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id            SERIAL PRIMARY KEY,
    room_id       INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message       TEXT,
    message_type  VARCHAR(20) DEFAULT 'text',
    file_url      TEXT,
    file_name     VARCHAR(255),
    is_read       BOOLEAN DEFAULT false,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

-- ============================================================
-- DEPARTMENTS TABLE (for multi-hospital/admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
