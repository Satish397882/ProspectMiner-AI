# ProspectMiner AI — Backend

FastAPI-based scraping engine and REST API for the ProspectMiner AI platform.

---

## Tech Stack

- Python 3.9+
- FastAPI
- MongoDB (via PyMongo)
- Playwright (Google Maps scraping)
- JWT authentication

---

## Setup

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Runs at `http://localhost:8000`

### Environment Variables

Create a `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/prospectminer
JWT_SECRET=your_secret_key_here
```

---

## API Endpoints

### Auth

- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login & get JWT token
- `GET /api/auth/me` — Get current user
- `POST /api/auth/verify` — Verify JWT token

### Scraping

- `POST /scrape/` — Start a new scraping job
- `GET /scrape/history` — Get user's job history
- `GET /scrape/stats` — Get user's stats
- `GET /scrape/analytics` — Get analytics data
- `GET /scrape/{job_id}` — Get job status & leads
- `GET /scrape/{job_id}/stream` — SSE real-time progress
- `DELETE /scrape/{job_id}` — Delete a job

> All endpoints except auth require `Authorization: Bearer <token>` header.
