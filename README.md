# ProspectMiner AI 🚀

**Domain-Specific Lead Mining Engine** — A production-grade lead generation platform that scrapes business data from Google Maps, enriches leads with AI scoring, and delivers real-time progress updates through a clean dashboard.

---

## ✅ Progress

### Week 1 — Scraper Core & Stealth

- Google Maps scraping with Playwright (headless browser)
- Extracts Name, Phone, Website, Rating, Address
- Handles bot detection with stealth configuration
- Successfully scrapes 50+ results per job

### Week 2 — Queue Management & Stability

- Background job processing with threading
- Server-Sent Events (SSE) for real-time progress bar
- Live status updates ("Scraping 12/50...")
- Concurrent job support with stable completion reporting

### Week 3 — Node.js Backend & AI Enrichment

- Dual-server architecture (Python scraper + Node.js job manager)
- BullMQ + Redis for production-grade job queuing
- JWT auth shared across both backends
- Lead enrichment pipeline: website crawling + social link detection
- AI lead scoring (hot / warm / cold) via Groq LLM
- Paginated leads table with filters (category, score, rating, search)
- Real-time enrichment progress via SSE
- Dashboard stats unified across Python + Node.js jobs
- CSV export for all leads

---

## Features

- 🔐 **JWT Authentication** — Secure login & signup with password strength validation
- 🗺️ **Google Maps Scraping** — Extract business name, phone, website, rating & address
- ⚡ **Real-time Progress** — Live updates via Server-Sent Events & polling
- 🤖 **AI Lead Scoring** — Groq LLM scores leads as hot / warm / cold with reasoning
- 🕸️ **Website Crawler** — Extracts emails, social links & contact signals from business websites
- 📊 **Analytics Dashboard** — Charts for jobs, leads, keywords & success rate
- 📁 **Job History** — View, search, filter, cancel & delete past scraping jobs
- 📥 **CSV Export** — Download leads as spreadsheet with one click
- 👤 **User Isolation** — Each user sees only their own data
- 🎨 **Animated UI** — Particle background across all pages

---

## Tech Stack

**Frontend** — React 19, Tailwind CSS, Recharts, React Router v6

**Node.js Backend** — Express, MongoDB, BullMQ, Redis, Groq LLM, Cheerio

**Python Backend** — FastAPI, MongoDB, Playwright, JWT

---

## Repositories

- 📁 [`/frontend`](./frontend) — React dashboard
- 📁 [`/backend`](./backend) — Node.js + Python servers
