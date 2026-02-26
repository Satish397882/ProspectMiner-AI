import time
import json
import os
from app.scrapers.google_maps import scrape_google_maps

JOBS_FILE = "jobs_data.json"

def load_jobs():
    if os.path.exists(JOBS_FILE):
        with open(JOBS_FILE, "r") as f:
            return json.load(f)
    return {}

def save_jobs(jobs):
    with open(JOBS_FILE, "w") as f:
        json.dump(jobs, f)

# In-memory cache (synced with file)
JOB_STATUS = load_jobs()

def run_scrape_job_sync(query: str, count: int = 10, job_id: str = None):
    print(f"🔵 Sync scraping for query: {query}, count: {count}")

    if job_id:
        JOB_STATUS[job_id]["progress"] = 10
        JOB_STATUS[job_id]["status"] = "scraping"
        save_jobs(JOB_STATUS)
        time.sleep(1.5)

        JOB_STATUS[job_id]["progress"] = 30
        save_jobs(JOB_STATUS)
        time.sleep(1)

        JOB_STATUS[job_id]["progress"] = 50
        save_jobs(JOB_STATUS)
        time.sleep(0.5)

    leads = scrape_google_maps(query, max_results=count)
    print(f"✅ Scraped {len(leads)} leads")

    if job_id and job_id in JOB_STATUS:
        JOB_STATUS[job_id]["progress"] = 70
        save_jobs(JOB_STATUS)
        time.sleep(0.5)

        JOB_STATUS[job_id]["progress"] = 85
        save_jobs(JOB_STATUS)
        time.sleep(0.5)

        JOB_STATUS[job_id]["progress"] = 100
        JOB_STATUS[job_id]["status"] = "completed"
        JOB_STATUS[job_id]["leads"] = leads
        save_jobs(JOB_STATUS)

    print(f"🎉 Job completed with {len(leads)} results")
    return leads