# ProspectMiner AI — Backend

Dual-server backend for ProspectMiner AI:

- **Node.js/Express** (port 5000) — Auth, job management, BullMQ queues, lead enrichment
- **Python/FastAPI** (port 8000) — Google Maps scraping with Playwright

---

## Tech Stack

### Node.js Server

- Node.js + Express
- MongoDB (Mongoose)
- BullMQ + Redis (Memurai on Windows)
- JWT Authentication
- Groq LLM (lead scoring)
- Cheerio (web crawling)

### Python Server

- Python 3.9+
- FastAPI
- MongoDB (PyMongo)
- Playwright (Google Maps scraping)
- JWT Authentication

---

## Setup

### 1. Install Dependencies

```bash
# Node.js
npm install

# Python
pip install -r requirements.txt
playwright install chromium
```

### 2. Environment Variables

Create a `.env` file in `/backend`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/prospectminer
JWT_SECRET=your_jwt_secret_here
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
NODE_ENV=development
PYTHON_API_URL=http://127.0.0.1:8000
GROQ_API_KEY=your_groq_api_key_here
```

> Copy from `.env.example` and fill in your values.

### 3. Redis Setup (Windows)

Install **Memurai** (Redis 7.0 for Windows):

- Download from https://www.memurai.com/
- Install and start service
- Verify: `memurai-cli ping` → should return `PONG`

### 4. Start Servers

**Terminal 1 — Node.js:**

```bash
cd backend
npm run dev
```

Runs at `http://localhost:5000`

**Terminal 2 — Python:**

```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

Runs at `http://localhost:8000`

---

## Node.js API Endpoints

### Auth

- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login & get JWT token
- `GET /api/auth/me` — Get current user

### Jobs

- `POST /api/jobs` — Create new scraping job
- `GET /api/jobs` — Get job history
- `GET /api/jobs/stats` — Get dashboard stats
- `GET /api/jobs/:jobId` — Get job status
- `DELETE /api/jobs/:jobId` — Delete job
- `PUT /api/jobs/:jobId/cancel` — Cancel job

### Leads

- `GET /api/leads/:jobId` — Get paginated leads (with filters)
- `GET /api/leads/:jobId/stats` — Get lead stats
- `POST /api/leads/:jobId/enrich` — Trigger enrichment
- `GET /api/leads/lead/:leadId` — Get single lead

### SSE (Real-time)

- `GET /api/sse/:jobId/progress` — Job progress stream
- `GET /api/sse/:jobId/enrichment` — Enrichment updates stream

---

## Python API Endpoints

### Auth

- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login & get JWT token
- `GET /api/auth/me` — Get current user

### Scraping

- `POST /scrape/` — Start scraping job
- `GET /scrape/history` — Get job history
- `GET /scrape/stats` — Get stats
- `GET /scrape/analytics` — Get analytics
- `GET /scrape/:jobId` — Get job status & leads
- `GET /scrape/:jobId/stream` — SSE real-time progress
- `DELETE /scrape/:jobId` — Delete job

> All endpoints except auth require `Authorization: Bearer <token>` header.
