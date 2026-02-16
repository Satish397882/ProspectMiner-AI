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
