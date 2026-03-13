# ProspectMiner AI — Frontend

React-based dashboard for the ProspectMiner AI lead generation platform.

---

## Tech Stack

- React 19
- Tailwind CSS
- Recharts
- Axios
- React Router v6

---

## Pages

- **Login / Signup** — JWT auth with password strength validator
- **Dashboard** — Stats overview, quick actions, auto-refreshing live stats
- **Create Job** — Keyword + location + lead count form
- **Job Progress** — Real-time scraping progress via polling
- **Job History** — Search, filter, delete & retry past jobs
- **Leads** — Paginated leads table with filters (category, score, rating, search), enrichment progress, CSV export
- **Analytics** — Charts for leads, jobs, keywords & success rate

---

## Setup

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173`

---

## Requirements

Make sure both backend servers are running:

| Server  | Command                                                                            | Port |
| ------- | ---------------------------------------------------------------------------------- | ---- |
| Node.js | `cd backend && npm run dev`                                                        | 5000 |
| Python  | `cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000` | 8000 |
