# ProspectMiner AI 🚀

**Domain-Specific Lead Mining Engine** — A production-grade lead generation platform that scrapes business data from Google Maps, delivers real-time progress updates, and presents actionable leads through a clean dashboard.

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

---

## Features

- 🔐 **JWT Authentication** — Secure login & signup with password strength validation
- 🗺️ **Google Maps Scraping** — Extract business name, phone, website, rating & address
- ⚡ **Real-time Progress** — Live progress bar via Server-Sent Events
- 📊 **Analytics Dashboard** — Charts for jobs, leads, keywords & success rate
- 📁 **Job History** — View, search, filter & delete past scraping jobs
- 📥 **CSV Export** — Download leads as spreadsheet with one click
- 👤 **User Isolation** — Each user sees only their own data
- 🎨 **Animated UI** — Particle background across all pages

---

## Tech Stack

**Frontend** — React, Tailwind CSS, Recharts  
**Backend** — Python, FastAPI, MongoDB, JWT  
**Scraping** — Playwright + Google Maps

---

## Repositories

- 📁 [`/frontend`](./frontend) — React application
- 📁 [`/backend`](./backend) — FastAPI server & scraping engine

---
