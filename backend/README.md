# ProspectMiner AI - Backend

> AI-powered B2B lead generation platform with intelligent web scraping and automated enrichment

## 🎯 Overview

ProspectMiner AI scrapes business data from Google Maps, enriches it with AI-powered insights, and delivers actionable leads through a REST API. The system integrates Node.js/Express for API management with Python/FastAPI for intelligent scraping and enrichment.

---

## ✨ Completed Features

### Week 1 ✅

- **Authentication System** - JWT-based auth with bcrypt password hashing
- **Job Management APIs** - Create, read, update, delete scraping jobs
- **Lead Management APIs** - Retrieve and filter scraped leads
- **CSV Export** - Download leads in spreadsheet format
- **MongoDB Schema** - Users, Jobs, and Leads collections with proper indexing
- **Protected Routes** - Middleware validation for secure endpoints

### Week 2 ✅

- **BullMQ Queue System** - Asynchronous background job processing
- **Redis Integration** - Queue management and caching
- **Worker System** - Concurrent job execution with retry logic
- **Server-Sent Events (SSE)** - Real-time progress streaming
- **Job Cancellation** - Cancel running jobs with validation
- **Progress Tracking** - Live status updates with percentage completion
- **Python Integration** - Connected Node.js worker with Python FastAPI scraper
- **End-to-End Testing** - Successfully scraped and saved 10 leads to MongoDB Atlas

---

**Integration Flow:**

1. User creates job → API validates and saves to MongoDB
2. Job queued → BullMQ adds to Redis queue
3. Worker picks job → Calls Python scraper via HTTP
4. Python scrapes → Extracts data from Google Maps with AI enrichment
5. Data saved → Enriched leads stored in MongoDB
6. Real-time updates → SSE streams progress to client

---

## 🛠️ Tech Stack

**Backend API (Node.js)**

- Node.js 18+ + Express.js
- MongoDB + Mongoose ODM
- JWT + bcrypt authentication
- BullMQ + Redis for queue management
- Server-Sent Events (SSE)

**Scraping Engine (Python)**

- FastAPI framework
- Playwright for web scraping
- AI enrichment (email discovery, social detection, categorization, scoring)
- Background task processing

**Infrastructure**

- MongoDB Atlas (Cloud database)
- Redis (Queue management)

---

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- MongoDB Atlas account
- Redis server (or Memurai for Windows)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/ProspectMiner-AI.git
cd ProspectMiner-AI/backend
```

### 2. Install Dependencies

```bash
# Node.js dependencies
npm install

# Python dependencies
pip install -r requirements.txt --break-system-packages
```

### 3. Configure Environment Variables

Create `.env` file in backend root:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/prospectminer?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_here

REDIS_HOST=localhost
REDIS_PORT=6379

PYTHON_API_URL=http://localhost:8000
```

### 4. Start Services

**Terminal 1 - Redis:**

```bash
redis-server
# Windows: memurai.exe
```

**Terminal 2 - Python Scraper:**

```bash
uvicorn app.main:app --reload --port 8000
```

**Terminal 3 - Node.js Server:**

```bash
npm start
```

Backend runs at `http://localhost:5000`

---

## 🔌 API Endpoints

### Authentication

**Register User**

```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123"
}
```

**Login**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure123"
}
```

### Job Management

**Create Scraping Job**

```http
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "keyword": "restaurants",
  "location": "Delhi",
  "numberOfLeads": 50
}
```

**Get Job Status**

```http
GET /api/jobs/:jobId
Authorization: Bearer <token>
```

**Get Job History**

```http
GET /api/jobs
Authorization: Bearer <token>
```

**Cancel Running Job**

```http
PUT /api/jobs/:jobId/cancel
Authorization: Bearer <token>
```

**Delete Job**

```http
DELETE /api/jobs/:jobId
Authorization: Bearer <token>
```

### Lead Management

**Get Leads for a Job**

```http
GET /api/leads/:jobId?page=1&limit=20
Authorization: Bearer <token>
```

**Get Single Lead**

```http
GET /api/leads/single/:leadId
Authorization: Bearer <token>
```

### Export

**Export Leads as CSV**

```http
GET /api/export/:jobId
Authorization: Bearer <token>
```

### Real-Time Updates

**Stream Job Progress**

```http
GET /api/sse/job/:jobId
Authorization: Bearer <token>
```

---

## 📊 Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (bcrypt hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Jobs Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  keyword: String,
  location: String,
  numberOfLeads: Number,
  status: String (enum: pending, processing, completed, failed, cancelled),
  progress: Number (0-100),
  leadsScraped: Number,
  error: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Leads Collection

```javascript
{
  _id: ObjectId,
  jobId: ObjectId (ref: Job, indexed),
  userId: ObjectId (ref: User, indexed),
  businessName: String,
  phone: String,
  website: String,
  email: String,
  rating: Number,
  address: String,
  category: String,
  leadScore: String (enum: hot, warm, cold),
  socials: Object,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 API Testing Results

**Testing Date**: February 19-21, 2026  
**Tool**: Postman  
**Status**: All endpoints tested successfully ✅

### Test Results

✅ **Authentication (2/2)**

- User registration with validation
- Login with JWT token generation

✅ **Job Management (5/5)**

- Job creation with queue processing
- Real-time status tracking
- Job history with pagination
- Cancel job with validation
- Delete job with cascade

✅ **Lead Management (2/2)**

- Get leads with filtering
- Single lead retrieval

✅ **Export (1/1)**

- CSV generation and download

✅ **Real-Time (1/1)**

- SSE streaming with auto-reconnect

**Total: 11/11 endpoints working** ✅

---

## 🔄 Worker System

Background job processing with BullMQ:

```javascript
// Worker picks job from queue
worker.on("active", (job) => {
  console.log(`Processing job: ${job.id}`);
});

// Calls Python scraper
const response = await axios.post(`${PYTHON_API_URL}/scrape/`, {
  keyword: job.data.keyword,
  location: job.data.location,
  count: job.data.numberOfLeads,
});

// Saves enriched leads to MongoDB
const leads = response.data.leads;
await Lead.insertMany(leads);

// Updates job status
await Job.findByIdAndUpdate(jobId, {
  status: "completed",
  progress: 100,
  leadsScraped: leads.length,
});
```

---

## 🤝 Team Contributions

**API & Infrastructure**: Designed REST API architecture, authentication system, MongoDB schema, BullMQ integration, Server-Sent Events, and comprehensive testing.

**Scraping & Enrichment**: Built Python scraping engine with Playwright, AI enrichment layer (email discovery, social detection, categorization, scoring), and background worker with retry logic.

---

## 📝 Important Notes

### Authentication

- All protected routes require JWT token in header: `Authorization: Bearer <token>`
- Tokens expire after 7 days

### Job Processing

- Jobs processed asynchronously via BullMQ
- Redis must be running for queue system
- Background worker handles execution

### Database

- MongoDB Atlas cloud database
- Collections: users, jobs, leads
- Automatic timestamps on all documents

### Real-time Updates

- SSE (Server-Sent Events) for live progress
- Connection open until job completes
- Automatic reconnection handling
