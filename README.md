# 🏥 Hospital App Backend

A robust RESTful API backend for a Hospital Management Application built with **Node.js** and **Express.js**. This service handles medical report uploads (PDFs, images) to **AWS S3** and is designed to integrate with a **React Native CLI** mobile frontend and **Oracle Database** (planned).

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Server](#running-the-server)
- [API Endpoints](#-api-endpoints)
  - [Health Check](#health-check)
  - [Upload Report](#upload-report)
- [Testing with Postman](#-testing-with-postman)
- [AWS S3 Setup](#-aws-s3-setup)
- [File Upload Rules](#-file-upload-rules)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🛠 Tech Stack

| Technology             | Purpose                          |
| ---------------------- | -------------------------------- |
| **Node.js**            | Runtime environment              |
| **Express.js**         | Web framework                    |
| **AWS S3**             | Cloud file storage               |
| **@aws-sdk/client-s3** | AWS SDK v3 for S3 operations     |
| **Multer**             | Multipart form-data file parsing |
| **UUID**               | Unique filename generation       |
| **CORS**               | Cross-origin resource sharing    |
| **dotenv**             | Environment variable management  |
| **Nodemon**            | Development auto-reload          |
| **Oracle DB** *(soon)* | Relational database              |
| **React Native CLI**   | Mobile frontend (separate repo)  |

---

## 📁 Project Structure

```
hospital-app-backend/
│
├── src/
│   ├── config/
│   │   └── s3.js                  # AWS S3 client configuration
│   │
│   ├── controllers/
│   │   └── reportController.js    # Report upload business logic
│   │
│   ├── middleware/
│   │   └── upload.js              # Multer file upload middleware
│   │
│   ├── routes/
│   │   └── reportRoutes.js        # Report API route definitions
│   │
│   ├── services/                  # Business logic services (planned)
│   │
│   └── utils/                     # Utility/helper functions (planned)
│
├── .env                           # Environment variables (not in git)
├── .gitignore                     # Git ignore rules
├── package.json                   # Project metadata & dependencies
├── README.md                      # Project documentation
└── server.js                      # Application entry point
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ — [Download](https://nodejs.org/)
- **npm** v9+ (comes with Node.js)
- **AWS Account** with S3 access — [AWS Console](https://aws.amazon.com/)
- **Postman** (optional, for API testing) — [Download](https://www.postman.com/)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd hospital-app-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
PORT=5000
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-north-1
AWS_BUCKET_NAME=hospital-app-storage-2026
```

> ⚠️ **Important:** Never commit the `.env` file to version control. It is already included in `.gitignore`.

### Running the Server

**Development** (with auto-reload via Nodemon):

```bash
npm run dev
```

**Production**:

```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in `.env`).

You should see:

```
🏥 Hospital API server is running on port 5000
```

---

## 📡 API Endpoints

### Health Check

Verify the server is running.

| Method | URL  | Description        |
| ------ | ---- | ------------------ |
| `GET`  | `/`  | API health check   |

**Response:**

```json
{
  "message": "Hospital API Running"
}
```

---

### Upload Report

Upload a medical report (PDF, image) to AWS S3.

| Method | URL                       | Description                    |
| ------ | ------------------------- | ------------------------------ |
| `POST` | `/api/reports/upload`     | Upload a file to S3            |

**Request:**

- **Content-Type:** `multipart/form-data`
- **Body:** Form-data with key `file` (type: File)

| Field  | Type   | Required | Description                       |
| ------ | ------ | -------- | --------------------------------- |
| `file` | File   | ✅ Yes   | The report file (PDF/image)       |

**Success Response** `200 OK`:

```json
{
  "success": true,
  "message": "Report uploaded successfully",
  "data": {
    "fileName": "blood-test-report.pdf",
    "s3Key": "reports/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
    "fileUrl": "https://hospital-app-storage-2026.s3.eu-north-1.amazonaws.com/reports/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
    "fileType": "application/pdf",
    "fileSize": 204800
  }
}
```

**Error Responses:**

| Status | Scenario                  | Response                                                       |
| ------ | ------------------------- | -------------------------------------------------------------- |
| `400`  | No file provided          | `{ "success": false, "message": "No file uploaded" }`          |
| `500`  | S3 upload failure         | `{ "success": false, "message": "Failed to upload report" }`   |
| `500`  | Unsupported file type     | Multer error with supported types listed                       |

---

## 🧪 Testing with Postman

1. Open **Postman** and create a new request.

2. Set the method to **POST** and the URL to:

   ```
   http://localhost:5000/api/reports/upload
   ```

3. Go to the **Body** tab → select **form-data**.

4. Add a new key:
   - **Key:** `file`
   - **Type:** Change from "Text" to **File** (click the dropdown)
   - **Value:** Select a PDF or image file from your computer

5. Click **Send**.

6. You should receive a `200` response with the S3 file URL.

**Screenshot Guide:**

```
┌──────────────────────────────────────────────────┐
│  POST  │ http://localhost:5000/api/reports/upload │
├──────────────────────────────────────────────────┤
│  Body  │  form-data                              │
├────────┼──────────┼─────────────────────────────┤
│  Key   │  Type    │  Value                       │
│  file  │  File    │  📎 blood-report.pdf          │
└────────┴──────────┴─────────────────────────────┘
```

---

## ☁️ AWS S3 Setup

### Bucket Configuration

| Setting         | Value                           |
| --------------- | ------------------------------- |
| Bucket Name     | `hospital-app-storage-2026`     |
| Region          | `eu-north-1` (Stockholm)        |
| Upload Folder   | `reports/`                      |

### IAM Permissions Required

The IAM user associated with your access keys needs the following S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::hospital-app-storage-2026",
        "arn:aws:s3:::hospital-app-storage-2026/*"
      ]
    }
  ]
}
```

### S3 File Organization

All uploaded reports are stored under the `reports/` prefix with UUID-based filenames to prevent collisions:

```
hospital-app-storage-2026/
└── reports/
    ├── a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf
    ├── f9e8d7c6-b5a4-3210-fedc-ba0987654321.png
    └── ...
```

---

## 📏 File Upload Rules

| Rule            | Value                                    |
| --------------- | ---------------------------------------- |
| Max file size   | **10 MB**                                |
| Allowed types   | `application/pdf`, `image/jpeg`, `image/png`, `image/jpg`, `image/webp` |
| Storage method  | Memory buffer → direct S3 upload         |
| Naming strategy | UUID v4 + original file extension        |
| S3 prefix       | `reports/`                               |

---

## 🗺 Roadmap

- [x] Project initialization & Express server
- [x] AWS S3 configuration
- [x] Multer file upload middleware
- [x] Report upload API (`POST /api/reports/upload`)
- [ ] Oracle Database integration
- [ ] User authentication & authorization
- [ ] Patient management CRUD APIs
- [ ] Doctor management CRUD APIs
- [ ] Appointment scheduling APIs
- [ ] Medical records management
- [ ] Prescription management
- [ ] Role-based access control (Admin, Doctor, Patient)
- [ ] API rate limiting & security hardening
- [ ] React Native CLI frontend integration

---

## 📦 Scripts

| Script          | Command           | Description                          |
| --------------- | ----------------- | ------------------------------------ |
| `npm start`     | `node server.js`  | Start production server              |
| `npm run dev`   | `nodemon server.js` | Start development server (auto-reload) |

---

## 📄 License

ISC

---

> **Built with ❤️ for modern healthcare management.**
