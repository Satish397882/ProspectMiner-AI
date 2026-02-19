# ProspectMiner AI - Backend

## API & System Architecture

### Week 1 Completed Features ✅

- Authentication System (JWT)
- Job Management APIs
- Lead Management APIs
- CSV Export Functionality
- MongoDB Models & Schema
- Database Configuration
- Protected Routes with Middleware

### Week 2 Completed Features ✅

- BullMQ Queue System - Background job processing
- Redis Integration - Queue management
- Worker System - Concurrent job processing
- Server-Sent Events (SSE) - Real-time progress tracking
- Job Cancellation - Cancel running jobs
- Progress Updates - Live job status streaming

### Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- BullMQ + Redis
- Server-Sent Events

### API Endpoints

#### Auth

- POST `/api/auth/signup` - User registration
- POST `/api/auth/login` - User login

#### Jobs

- POST `/api/jobs` - Create scraping job
- GET `/api/jobs` - Get job history
- GET `/api/jobs/:jobId` - Get job status
- PUT `/api/jobs/:jobId/cancel` - Cancel running job
- DELETE `/api/jobs/:jobId` - Delete job

#### Leads

- GET `/api/leads/:jobId` - Get leads for a job
- GET `/api/leads/single/:leadId` - Get single lead

#### Export

- GET `/api/export/:jobId` - Export leads as CSV

#### SSE

- GET `/api/sse/job/:jobId` - Stream job progress updates

### Setup Instructions

1. Install dependencies: `npm install`
2. Create `.env` file with required variables
3. Start Redis: `redis-server`
4. Start server: `npm start`

---

## 🧪 API Testing & Validation

### All APIs Tested Successfully ✅

**Testing Date**: February 19, 2026  
**Tool Used**: Postman  
**Total Endpoints**: 9

#### Test Results Summary

1. ✅ **Authentication APIs** (2/2)
   - User Signup - Working
   - User Login - Working with JWT generation

2. ✅ **Job Management APIs** (5/5)
   - Create Job - Queue processing working
   - Get Job Status - Real-time status tracking
   - Get Job History - User job list retrieval
   - Cancel Job - Validation working correctly
   - Delete Job - Record removal working

3. ✅ **Lead APIs** (1/1)
   - Get Leads - Endpoint working with pagination

4. ✅ **Export API** (1/1)
   - CSV Export - File generation working

5. ✅ **Real-time API** (1/1)
   - SSE Progress - Live streaming working perfectly

---

## 📋 API Request Examples

### 1. User Signup

```bash
POST /api/auth/signup
Content-Type: application/json

{
  "name": "Navya Jain",
  "email": "navya@test.com",
  "password": "test1234"
}
```

**Response:**

```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6996c92a8630d74caa1b23e5",
    "name": "Navya Jain",
    "email": "navya@test.com"
  }
}
```

---

### 2. User Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "navya@test.com",
  "password": "test1234"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6996c92a8630d74caa1b23e5",
    "name": "Navya Jain",
    "email": "navya@test.com"
  }
}
```

---

### 3. Create Job (Protected Route)

```bash
POST /api/jobs
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "keyword": "restaurants",
  "location": "Delhi",
  "numberOfLeads": 10
}
```

**Response:**

```json
{
  "message": "Job created and queued successfully",
  "job": {
    "_id": "6997086b12745d41ea334c73",
    "userId": "6996c92a8630d74caa1b23e5",
    "keyword": "restaurants",
    "location": "Delhi",
    "numberOfLeads": 10,
    "status": "pending",
    "progress": 0,
    "leadsScraped": 0,
    "createdAt": "2026-02-19T12:56:11.832Z"
  }
}
```

---

### 4. Get Job Status (Protected Route)

```bash
GET /api/jobs/6997086b12745d41ea334c73
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**

```json
{
  "job": {
    "_id": "6997086b12745d41ea334c73",
    "status": "completed",
    "progress": 100,
    "leadsScraped": 10,
    "keyword": "restaurants",
    "location": "Delhi"
  }
}
```

---

### 5. Get Job History (Protected Route)

```bash
GET /api/jobs
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**

```json
{
  "jobs": [
    {
      "_id": "6997086b12745d41ea334c73",
      "keyword": "restaurants",
      "location": "Delhi",
      "status": "completed",
      "progress": 100,
      "leadsScraped": 10
    }
  ]
}
```

---

### 6. Get Leads (Protected Route)

```bash
GET /api/leads/6997086b12745d41ea334c73
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**

```json
{
  "leads": [],
  "totalPages": 0,
  "currentPage": 1,
  "totalLeads": 0
}
```

---

### 7. Export CSV (Protected Route)

```bash
GET /api/export/6997086b12745d41ea334c73
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:** CSV file download

---

### 8. SSE Real-time Progress (Protected Route)

```bash
GET /api/sse/job/6997086b12745d41ea334c73
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:** Server-Sent Events stream

```
data: {"type":"connected","jobId":"6997086b12745d41ea334c73"}

data: {"type":"update","job":{...}}

data: {"type":"done","job":{...}}
```

---

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.1cbhtib.mongodb.net/prospectminer?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
```

**Note:** Replace `<username>` and `<password>` with your actual MongoDB credentials.

---

## 📝 Important Notes

### Authentication

- All protected routes require JWT token
- Token must be sent in `Authorization: Bearer <token>` header
- Tokens expire after 7 days

### Job Processing

- Jobs are processed asynchronously via BullMQ
- Redis must be running for queue system to work
- Background worker handles job execution

### Database

- MongoDB Atlas cloud database required
- Collections: users, jobs, leads
- Automatic timestamps on all documents

### Real-time Updates

- SSE (Server-Sent Events) for live progress tracking
- Connection remains open until job completes
- Automatic reconnection handling

---
