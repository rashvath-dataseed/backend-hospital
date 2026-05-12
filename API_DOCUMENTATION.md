# Hospital Management System API Documentation

**Base URL**: `http://localhost:6000`  
**Authentication**: Bearer Token (JWT) in Authorization Header.

---

## 1. Authentication & Profile
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user (PATIENT, DOCTOR, RECEPTIONIST) |
| POST | `/api/auth/login` | Public | Login & get JWT. Checks `is_active` status. |
| POST | `/api/auth/profile-image` | Auth | Upload/Update profile picture (S3) |

---

## 2. Patients Module
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/patients/create-profile` | PATIENT | Initialize patient medical profile |
| GET | `/api/patients/my-profile` | PATIENT | Get own profile details |
| PUT | `/api/patients/update-profile` | PATIENT | Update medical info (allergies, etc.) |

---

## 3. Doctors Module
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/doctors/create-profile` | DOCTOR | Set specialization, availability, etc. |
| GET | `/api/doctors/my-profile` | DOCTOR | Get own professional profile |
| PUT | `/api/doctors/update-profile` | DOCTOR | Update professional info |
| GET | `/api/doctors` | Auth | Search/Filter doctors (by name, specialization) |

---

## 4. Appointments Module
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/appointments/book` | PNT, REC | Book slot (conflict checking) |
| GET | `/api/appointments/my-appointments` | ALL | Role-aware appointment listing |
| PUT | `/api/appointments/cancel/:id` | PNT, REC | Cancel appointment |
| PUT | `/api/appointments/update-status/:id` | DOC, ADM, REC | Change status (CONFIRMED, COMPLETED, etc.) |
| PUT | `/api/appointments/reschedule/:id` | PNT, DOC, REC | Reschedule date/time |

---

## 5. Prescriptions Module
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/prescriptions/create` | DOCTOR | Create digital prescription (JSON meds list) |
| GET | `/api/prescriptions/patient/:id` | DOC, PNT | View history |

---

## 6. Medical Reports Module (Private S3)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/reports/upload` | PNT, DOC | Upload report to private S3 bucket |
| GET | `/api/reports/my-reports` | ALL | Get reports with **1-hour Signed URLs** |

---

## 7. Billing Module
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/billing/create` | ADM, DOC, REC | Generate invoice |
| GET | `/api/billing/my-bills` | PNT, ADM, REC | View billing history |

---

## 8. Notifications Module
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/notifications` | Auth | List notifications (paginated) |
| PUT | `/api/notifications/:id/read` | Auth | Mark single as read |
| PUT | `/api/notifications/read-all` | Auth | Mark all as read |
| POST | `/api/notifications/register-token` | Auth | Register FCM token for push |

---

## 9. Real-Time Chat (REST + Socket.IO)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/chat/room` | PNT, DOC | Get/Create chat room between doctor & patient |
| GET | `/api/chat/rooms` | PNT, DOC | List active conversations with unread counts |
| GET | `/api/chat/room/:id/messages` | PNT, DOC | Fetch message history |

**Socket.IO Events**:
- `join_room` / `send_message` / `typing_start` / `typing_stop` / `mark_read`

---

## 10. Admin Module
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/users` | ADMIN | Manage users (search, filter, role) |
| PUT | `/api/admin/users/:id/toggle-status` | ADMIN | Activate/Deactivate accounts |
| GET | `/api/admin/analytics` | ADMIN | Dashboard (Revenue, Growth, Trends) |
| POST | `/api/admin/departments` | ADMIN | Create hospital departments |

---

## 11. Core Infrastructure
- **Docker**: `docker-compose up` builds backend + PostgreSQL 17.
- **Security**: JWT Auth + RBAC Middleware + S3 Signed URLs + DB `is_active` Guard.
- **Logging**: Morgan (Dev mode enabled).
