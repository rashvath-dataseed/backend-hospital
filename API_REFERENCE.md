# Hospital Management System — API Reference

**Base URL (Production):** `https://backend-hospital-emzh.onrender.com`  
**Base URL (Local):** `http://localhost:5000`  
**Authentication:** All protected endpoints require the header:
```
Authorization: Bearer <token>
```
Tokens are obtained from `/api/auth/register` or `/api/auth/login` and expire after **7 days**.

---

## Table of Contents
1. [Authentication](#1-authentication)
2. [Patient Module](#2-patient-module)
3. [Doctor Module](#3-doctor-module)
4. [Appointments](#4-appointments)
5. [Prescriptions](#5-prescriptions)
6. [Medical Reports](#6-medical-reports)
7. [Billing](#7-billing)
8. [Notifications](#8-notifications)
9. [Chat](#9-chat)
10. [Admin](#10-admin)
11. [Complete App Flow](#11-complete-app-flow)
12. [Roles & Permissions](#12-roles--permissions)
13. [Response Format](#13-response-format)
14. [Error Codes](#14-error-codes)

---

## 1. Authentication

### POST `/api/auth/register`
Register a new user account.

**Access:** Public

**Request Body:**
```json
{
  "full_name": "Dr. John Smith",
  "email": "john@hospital.com",
  "password": "SecurePass123",
  "role": "DOCTOR",
  "phone": "+1234567890"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `full_name` | string | Yes | Full display name |
| `email` | string | Yes | Must be unique |
| `password` | string | Yes | Min 6 characters recommended |
| `role` | string | Yes | `PATIENT`, `DOCTOR`, `RECEPTIONIST`, or `ADMIN` |
| `phone` | string | No | Contact number |

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGci...",
  "user": {
    "id": 1,
    "full_name": "Dr. John Smith",
    "email": "john@hospital.com",
    "role": "DOCTOR"
  }
}
```

---

### POST `/api/auth/login`
Login and receive a JWT token.

**Access:** Public

**Request Body:**
```json
{
  "email": "john@hospital.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGci...",
  "user": {
    "id": 1,
    "full_name": "Dr. John Smith",
    "email": "john@hospital.com",
    "role": "DOCTOR"
  }
}
```

> **Note:** If the account has been deactivated by an admin, login returns `403 Forbidden`.

---

### POST `/api/auth/profile-image`
Upload or update the logged-in user's profile picture.

**Access:** Any authenticated user  
**Content-Type:** `multipart/form-data`

**Form Data:**
| Field | Type | Required |
|-------|------|----------|
| `image` | file | Yes — JPEG, PNG, etc. |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile image updated",
  "profile_image": "https://s3.amazonaws.com/..."
}
```

---

## 2. Patient Module

> All routes require role: **PATIENT**

### POST `/api/patients/create-profile`
Create the patient's medical profile (must be called once after registration before booking appointments).

**Request Body:**
```json
{
  "gender": "female",
  "blood_group": "O+",
  "date_of_birth": "1990-05-15",
  "address": "123 Main St, New York",
  "emergency_contact": "+1987654321",
  "allergies": "Penicillin, Dust"
}
```

| Field | Type | Required |
|-------|------|----------|
| `gender` | string | No |
| `blood_group` | string | No |
| `date_of_birth` | date (`YYYY-MM-DD`) | No |
| `address` | string | No |
| `emergency_contact` | string | No |
| `allergies` | string | No |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Patient profile created successfully",
  "data": {
    "id": 5,
    "user_id": 1,
    "gender": "female",
    "blood_group": "O+",
    "date_of_birth": "1990-05-15",
    ...
  }
}
```

> Returns `409 Conflict` if profile already exists.

---

### GET `/api/patients/my-profile`
Retrieve the logged-in patient's full medical profile.

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "user_id": 1,
    "full_name": "Jane Patient",
    "email": "jane@test.com",
    "gender": "female",
    "blood_group": "O+",
    "date_of_birth": "1990-05-15",
    "address": "123 Main St",
    "emergency_contact": "+1987654321",
    "allergies": "Penicillin"
  }
}
```

---

### PUT `/api/patients/update-profile`
Update the patient's medical profile.

**Request Body** (all fields optional):
```json
{
  "gender": "female",
  "blood_group": "A+",
  "date_of_birth": "1990-05-15",
  "address": "456 New Ave, Los Angeles",
  "emergency_contact": "+1111111111",
  "allergies": "None"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```

---

## 3. Doctor Module

### POST `/api/doctors/create-profile`
Create the doctor's professional profile (must be called once after registration).

**Access:** DOCTOR only

**Request Body:**
```json
{
  "specialization": "Cardiology",
  "experience_years": 10,
  "consultation_fee": 500,
  "hospital_name": "City Medical Center",
  "qualification": "MBBS, MD Cardiology",
  "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "available_time": "09:00-17:00"
}
```

| Field | Type | Required |
|-------|------|----------|
| `specialization` | string | Yes |
| `experience_years` | number | No |
| `consultation_fee` | number | No |
| `hospital_name` | string | No |
| `qualification` | string | No |
| `available_days` | array of strings | No |
| `available_time` | string | No — e.g. `"09:00-17:00"` |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Doctor profile created successfully",
  "data": {
    "id": 3,
    "user_id": 2,
    "specialization": "Cardiology",
    "consultation_fee": 500,
    ...
  }
}
```

> Returns `409 Conflict` if profile already exists.

---

### GET `/api/doctors/my-profile`
Get the logged-in doctor's own professional profile.

**Access:** DOCTOR only  
**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "full_name": "Dr. John Smith",
    "email": "john@hospital.com",
    "specialization": "Cardiology",
    "experience_years": 10,
    "consultation_fee": 500,
    "hospital_name": "City Medical Center",
    "qualification": "MBBS, MD",
    "available_days": ["Monday", "Tuesday"],
    "available_time": "09:00-17:00"
  }
}
```

---

### PUT `/api/doctors/update-profile`
Update the doctor's professional profile.

**Access:** DOCTOR only

**Request Body** (all fields optional):
```json
{
  "specialization": "Neurology",
  "experience_years": 12,
  "consultation_fee": 750,
  "hospital_name": "Metro Hospital",
  "qualification": "MBBS, MD, DM Neurology",
  "available_days": ["Monday", "Wednesday", "Friday"],
  "available_time": "10:00-16:00"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```

---

### GET `/api/doctors`
Search and list all doctors. Available to any authenticated user.

**Access:** Any authenticated user  
**Request Body:** None  
**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `name` | string | Search by doctor name (partial match) |
| `specialization` | string | Filter by specialization (partial match) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 10) |

**Example:** `GET /api/doctors?specialization=cardiology&page=1&limit=10`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "full_name": "Dr. John Smith",
      "email": "john@hospital.com",
      "specialization": "Cardiology",
      "consultation_fee": 500,
      "hospital_name": "City Medical Center",
      "available_days": ["Monday", "Tuesday"],
      "available_time": "09:00-17:00"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "total": 15,
    "limit": 10
  }
}
```

---

### GET `/api/doctors/:id`
Get a specific doctor's full profile by their doctor profile ID.

**Access:** Any authenticated user  
**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "full_name": "Dr. John Smith",
    "specialization": "Cardiology",
    "consultation_fee": 500,
    ...
  }
}
```

> Returns `404` if doctor not found.

---

## 4. Appointments

### POST `/api/appointments/book`
Book an appointment with a doctor.

**Access:** PATIENT, RECEPTIONIST

**Request Body:**
```json
{
  "doctor_id": 3,
  "appointment_date": "2026-06-15",
  "appointment_time": "10:00",
  "reason": "Chest pain and shortness of breath"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `doctor_id` | number | Yes | The doctor's profile ID (from `/api/doctors`) |
| `appointment_date` | string | Yes | Format: `YYYY-MM-DD` |
| `appointment_time` | string | Yes | Format: `HH:MM` (24-hour) |
| `reason` | string | No | Reason for visit |
| `patient_id` | number | Receptionist only | Required when RECEPTIONIST books on behalf of a patient |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {
    "id": 10,
    "patient_id": 5,
    "doctor_id": 3,
    "appointment_date": "2026-06-15",
    "appointment_time": "10:00",
    "reason": "Chest pain",
    "status": "PENDING",
    "created_at": "2026-05-13T10:00:00Z"
  }
}
```

> Returns `409 Conflict` if that doctor's time slot is already booked.

---

### GET `/api/appointments/my-appointments`
List appointments for the logged-in user. Role-aware — each role sees relevant appointments.

**Access:** All authenticated users  
**Request Body:** None  
**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED` |
| `page` | number | Default: 1 |
| `limit` | number | Default: 10 |

**Response includes flat fields:**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "appointment_date": "2026-06-15",
      "appointment_time": "10:00",
      "status": "PENDING",
      "reason": "Chest pain",
      "patient_name": "Jane Patient",
      "patient_phone": "+1234567890",
      "doctor_name": "Dr. John Smith",
      "specialization": "Cardiology"
    }
  ],
  "pagination": { "currentPage": 1, "limit": 10 }
}
```

> - **PATIENT** sees only their own appointments  
> - **DOCTOR** sees only appointments assigned to them  
> - **ADMIN / RECEPTIONIST** sees all appointments system-wide

---

### PUT `/api/appointments/update-status/:id`
Update the status of an appointment.

**Access:** DOCTOR, ADMIN, RECEPTIONIST

**Request Body:**
```json
{
  "status": "CONFIRMED"
}
```

Valid status values: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Appointment status updated to CONFIRMED",
  "data": { ... }
}
```

> Automatically sends a notification to the patient when status changes.

---

### PUT `/api/appointments/reschedule/:id`
Reschedule an existing appointment to a new date and time. Resets status to `PENDING`.

**Access:** PATIENT, DOCTOR, RECEPTIONIST

**Request Body:**
```json
{
  "appointment_date": "2026-07-01",
  "appointment_time": "14:00"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Appointment rescheduled successfully",
  "data": { ... }
}
```

> Cannot reschedule a `CANCELLED` or `COMPLETED` appointment.  
> Returns `409` if new slot is already taken.

---

### PUT `/api/appointments/cancel/:id`
Cancel an appointment.

**Access:** PATIENT, RECEPTIONIST

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "data": { ... }
}
```

> Cannot cancel an already `CANCELLED` or `COMPLETED` appointment.

---

## 5. Prescriptions

### POST `/api/prescriptions/create`
Create a digital prescription for a patient.

**Access:** DOCTOR only

**Request Body:**
```json
{
  "patient_id": 5,
  "appointment_id": 10,
  "diagnosis": "Hypertension Stage 1",
  "medicines": [
    {
      "name": "Amlodipine",
      "dosage": "5mg",
      "frequency": "Once daily",
      "duration": "30 days"
    },
    {
      "name": "Aspirin",
      "dosage": "75mg",
      "frequency": "Once daily after meals",
      "duration": "Ongoing"
    }
  ],
  "notes": "Avoid salty food. Follow up in 4 weeks."
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `patient_id` | number | Yes | The patient's **profile ID** (from patients table, not user ID) |
| `appointment_id` | number | No | Link to a specific appointment |
| `diagnosis` | string | Yes | Medical diagnosis |
| `medicines` | array | Yes | List of medication objects |
| `notes` | string | No | Additional doctor's notes |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Prescription created successfully",
  "data": {
    "id": 7,
    "doctor_id": 3,
    "patient_id": 5,
    "diagnosis": "Hypertension Stage 1",
    "medicines": [...],
    "notes": "Avoid salty food.",
    "created_at": "2026-05-13T12:00:00Z"
  }
}
```

---

### GET `/api/prescriptions/patient/:id`
Get all prescriptions for a patient.

**Access:** DOCTOR (any patient), PATIENT (own prescriptions only)

**URL Param:** `:id` = patient's **profile ID** (not user ID)  
**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 7,
      "diagnosis": "Hypertension Stage 1",
      "medicines": [...],
      "notes": "Avoid salty food.",
      "doctor_name": "Dr. John Smith",
      "specialization": "Cardiology",
      "patient_name": "Jane Patient",
      "created_at": "2026-05-13T12:00:00Z"
    }
  ],
  "count": 1
}
```

---

## 6. Medical Reports

### POST `/api/reports/upload`
Upload a medical report (PDF, image, etc.) to secure S3 storage.

**Access:** PATIENT, DOCTOR  
**Content-Type:** `multipart/form-data`

**Form Data:**
| Field | Type | Required |
|-------|------|----------|
| `file` | file | Yes — PDF, JPEG, PNG, etc. |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Report uploaded successfully",
  "data": {
    "id": 2,
    "file_name": "blood_test.pdf",
    "file_url": "s3://bucket/reports/...",
    "uploaded_at": "2026-05-13T10:00:00Z"
  }
}
```

---

### GET `/api/reports/my-reports`
Get all reports belonging to the logged-in user. Each report includes a **1-hour signed URL** for secure download.

**Access:** Any authenticated user  
**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "file_name": "blood_test.pdf",
      "signed_url": "https://s3.amazonaws.com/...?X-Amz-Expires=3600...",
      "uploaded_at": "2026-05-13T10:00:00Z"
    }
  ]
}
```

> Signed URLs expire after **1 hour**. Re-fetch to get a fresh link.

---

## 7. Billing

### POST `/api/billing/create`
Generate an invoice/bill for a patient.

**Access:** ADMIN, DOCTOR, RECEPTIONIST

**Request Body:**
```json
{
  "patient_id": 5,
  "appointment_id": 10,
  "amount": 500,
  "invoice_url": "https://s3.amazonaws.com/invoices/inv_001.pdf"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `patient_id` | number | Yes | Patient's **profile ID** (not user ID) |
| `appointment_id` | number | No | Link to an appointment |
| `amount` | number | Yes | Billing amount |
| `invoice_url` | string | No | S3 URL of the PDF invoice |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Bill created successfully",
  "data": {
    "id": 4,
    "patient_id": 5,
    "appointment_id": 10,
    "amount": 500,
    "status": "PENDING",
    "created_at": "2026-05-13T12:00:00Z"
  }
}
```

---

### GET `/api/billing/my-bills`
Retrieve billing history.

**Access:** PATIENT (own bills), ADMIN, RECEPTIONIST (all bills)  
**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 4,
      "amount": 500,
      "status": "PENDING",
      "patient_name": "Jane Patient",
      "created_at": "2026-05-13T12:00:00Z"
    }
  ],
  "count": 1
}
```

---

## 8. Notifications

Notifications are automatically created by the system for key events (appointment booked, confirmed, cancelled, etc.). They can also be sent as push notifications if an FCM token is registered.

### GET `/api/notifications`
Get the logged-in user's notifications (paginated).

**Access:** Any authenticated user  
**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Default: 1 |
| `limit` | number | Default: 20 |
| `unread_only` | boolean | `true` to return only unread |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "title": "Appointment Confirmed",
      "message": "Your appointment has been confirmed",
      "is_read": false,
      "type": "APPOINTMENT",
      "created_at": "2026-05-13T10:00:00Z"
    }
  ],
  "unreadCount": 3,
  "pagination": { "currentPage": 1, "limit": 20 }
}
```

---

### PUT `/api/notifications/:id/read`
Mark a single notification as read.

**Access:** Any authenticated user  
**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### PUT `/api/notifications/read-all`
Mark all notifications as read.

**Access:** Any authenticated user  
**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### POST `/api/notifications/register-token`
Register a Firebase Cloud Messaging (FCM) token for push notifications.

**Access:** Any authenticated user

**Request Body:**
```json
{
  "fcm_token": "dxxxxxxxxxxxxxxxxx..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "FCM token registered"
}
```

---

### DELETE `/api/notifications/:id`
Delete a specific notification.

**Access:** Any authenticated user  
**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

## 9. Chat

Chat supports both **REST API** (for message history) and **Socket.IO** (for real-time messaging).

### POST `/api/chat/room`
Create a new chat room or retrieve an existing one between a patient and doctor.

**Access:** PATIENT, DOCTOR

**Request Body:**
```json
{
  "recipient_id": 2
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `recipient_id` | number | Yes | The **user ID** of the other party. Patient must pass a doctor's user ID; Doctor must pass a patient's user ID. |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "room": {
      "id": 1,
      "patient_id": 43,
      "doctor_id": 44,
      "created_at": "2026-05-13T10:00:00Z"
    },
    "recipient": {
      "id": 2,
      "full_name": "Dr. John Smith",
      "role": "DOCTOR",
      "profile_image": "https://..."
    }
  }
}
```

---

### GET `/api/chat/rooms`
List all chat rooms for the logged-in user with unread message counts.

**Access:** PATIENT, DOCTOR  
**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "patient_name": "Jane Patient",
      "patient_image": "https://...",
      "doctor_name": "Dr. John Smith",
      "doctor_image": "https://...",
      "unread_count": "2",
      "last_message_at": "2026-05-13T11:00:00Z"
    }
  ]
}
```

---

### GET `/api/chat/room/:id/messages`
Retrieve message history for a chat room (paginated, newest last).

**Access:** PATIENT, DOCTOR  
**Request Body:** None  
**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Default: 1 |
| `limit` | number | Default: 50 |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 55,
      "room_id": 1,
      "sender_id": 43,
      "content": "Hello doctor, I have a question.",
      "is_read": true,
      "created_at": "2026-05-13T10:05:00Z"
    }
  ]
}
```

---

### POST `/api/chat/room/:id/message`
Send a message via REST (alternative to Socket.IO).

**Access:** PATIENT, DOCTOR

**Request Body:**
```json
{
  "content": "Hello, when is my next appointment?"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 56,
    "room_id": 1,
    "sender_id": 43,
    "content": "Hello, when is my next appointment?",
    "created_at": "2026-05-13T10:10:00Z"
  }
}
```

---

### Socket.IO (Real-Time)

Connect to the server with:
```js
io('https://backend-hospital-emzh.onrender.com', {
  auth: { token: '<your JWT token>' }
})
```

**Client → Server Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ roomId: 1 }` | Subscribe to room messages |
| `send_message` | `{ roomId: 1, content: "Hello" }` | Send a message |
| `typing_start` | `{ roomId: 1 }` | Notify other user you're typing |
| `typing_stop` | `{ roomId: 1 }` | Stop typing indicator |
| `mark_read` | `{ roomId: 1 }` | Mark messages in room as read |

**Server → Client Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `{ id, sender_id, content, created_at }` | A new message arrived |
| `typing_start` | `{ userId }` | Other user started typing |
| `typing_stop` | `{ userId }` | Other user stopped typing |

---

## 10. Admin

> All admin routes require role: **ADMIN**

### GET `/api/admin/users`
List all users with optional filters.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `role` | string | Filter by role |
| `is_active` | boolean | `true` or `false` |
| `search` | string | Search by name or email |
| `page` | number | Default: 1 |
| `limit` | number | Default: 20 |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "full_name": "Dr. John Smith",
      "email": "john@hospital.com",
      "role": "DOCTOR",
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": { "currentPage": 1, "totalPages": 3, "totalUsers": 50, "limit": 20 }
}
```

---

### GET `/api/admin/users/:id`
Get full details of a specific user.

**Request Body:** None

---

### PUT `/api/admin/users/:id/toggle-status`
Activate or deactivate a user account. Deactivated users cannot log in.

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": { "id": 5, "is_active": false }
}
```

---

### PUT `/api/admin/users/:id/role`
Change a user's role.

**Request Body:**
```json
{
  "role": "RECEPTIONIST"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User role updated",
  "data": { "id": 5, "role": "RECEPTIONIST" }
}
```

---

### GET `/api/admin/analytics`
Get dashboard analytics — revenue, user growth, appointment trends.

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalDoctors": 20,
    "totalPatients": 120,
    "totalAppointments": 340,
    "completedAppointments": 280,
    "totalRevenue": 145000
  }
}
```

---

### POST `/api/admin/departments`
Create a hospital department.

**Request Body:**
```json
{
  "name": "Cardiology",
  "description": "Heart and cardiovascular care"
}
```

---

### GET `/api/admin/departments`
List all departments.

---

### PUT `/api/admin/departments/:id`
Update a department.

**Request Body:**
```json
{
  "name": "Cardiology & Vascular Surgery",
  "description": "Updated description"
}
```

---

### GET `/api/admin/appointments`
View all appointments system-wide.

**Query Parameters:** Same as `GET /api/appointments/my-appointments`.

---

## 11. Complete App Flow

### Patient Journey
```
1. POST /api/auth/register           → Create account (role: PATIENT)
2. POST /api/patients/create-profile → Initialize medical profile (required before booking)
3. GET  /api/doctors                 → Browse available doctors (search by name/specialization)
4. GET  /api/doctors/:id             → View doctor details
5. POST /api/appointments/book       → Book appointment (doctor_id + date + time)
6. GET  /api/appointments/my-appointments → Track appointment status
7. POST /api/chat/room               → Start chat with doctor (recipient_id = doctor's user ID)
8. GET  /api/prescriptions/patient/:id   → View prescriptions after consultation
9. GET  /api/reports/my-reports          → Access medical reports
10. GET /api/billing/my-bills            → View invoices
11. GET /api/notifications               → Stay updated on appointment changes
```

### Doctor Journey
```
1. POST /api/auth/register              → Create account (role: DOCTOR)
2. POST /api/doctors/create-profile     → Set specialization, fee, availability
3. GET  /api/appointments/my-appointments → View patient appointments
4. PUT  /api/appointments/update-status/:id → Confirm (CONFIRMED) or complete (COMPLETED) appointments
5. POST /api/prescriptions/create       → Write digital prescription for patient
6. GET  /api/chat/rooms                 → View all patient conversations
7. POST /api/billing/create             → Generate patient invoice
8. POST /api/reports/upload             → Upload patient medical reports
```

### Admin Journey
```
1. POST /api/auth/register              → Create account (role: ADMIN)
2. GET  /api/admin/analytics            → Dashboard overview
3. GET  /api/admin/users                → Manage all users
4. PUT  /api/admin/users/:id/toggle-status → Activate/deactivate accounts
5. PUT  /api/admin/users/:id/role       → Change user roles
6. POST /api/admin/departments          → Create departments
7. GET  /api/admin/appointments         → View all appointments
```

---

## 12. Roles & Permissions

| Endpoint | PATIENT | DOCTOR | RECEPTIONIST | ADMIN |
|----------|---------|--------|--------------|-------|
| Register / Login | ✅ | ✅ | ✅ | ✅ |
| Patient profile CRUD | ✅ | ❌ | ❌ | ❌ |
| Doctor profile CRUD | ❌ | ✅ | ❌ | ❌ |
| List / view doctors | ✅ | ✅ | ✅ | ✅ |
| Book appointment | ✅ | ❌ | ✅ | ❌ |
| View own appointments | ✅ | ✅ | ✅ | ✅ |
| Update appointment status | ❌ | ✅ | ✅ | ✅ |
| Cancel appointment | ✅ | ❌ | ✅ | ❌ |
| Reschedule appointment | ✅ | ✅ | ✅ | ❌ |
| Create prescription | ❌ | ✅ | ❌ | ❌ |
| View prescriptions | ✅ | ✅ | ❌ | ✅ |
| Upload report | ✅ | ✅ | ❌ | ❌ |
| View reports | ✅ | ✅ | ✅ | ✅ |
| Create bill | ❌ | ✅ | ✅ | ✅ |
| View bills | ✅ | ❌ | ✅ | ✅ |
| Chat | ✅ | ✅ | ❌ | ❌ |
| Notifications | ✅ | ✅ | ✅ | ✅ |
| Admin: user management | ❌ | ❌ | ❌ | ✅ |
| Admin: analytics | ❌ | ❌ | ❌ | ✅ |
| Admin: departments | ❌ | ❌ | ❌ | ✅ |

---

## 13. Response Format

All responses follow a consistent structure:

**Success:**
```json
{
  "success": true,
  "message": "Human-readable success message",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

---

## 14. Error Codes

| Status Code | Meaning |
|-------------|---------|
| `200` | OK — Request successful |
| `201` | Created — Resource created successfully |
| `400` | Bad Request — Missing or invalid fields |
| `401` | Unauthorized — Missing or invalid JWT token |
| `403` | Forbidden — Account deactivated or insufficient role |
| `404` | Not Found — Resource does not exist |
| `409` | Conflict — Duplicate resource (e.g. profile already exists, time slot already booked) |
| `500` | Internal Server Error — Unexpected server error |
