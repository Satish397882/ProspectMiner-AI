import time
from pymongo import MongoClient
from app.scrapers.google_maps import scrape_google_maps
import os

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/prospectminer")
client = MongoClient(MONGODB_URI)
db = client.get_database("prospectminer")
jobs_collection = db["jobs"]

# In-memory cache for SSE progress (fast reads)
JOB_STATUS = {}


def load_jobs():
    """Load all jobs from MongoDB into memory on startup"""
    try:
        for job in jobs_collection.find({}):
            job_id = job["job_id"]
            status = job.get("status", "unknown")
            progress = 100 if status == "completed" else job.get("progress", 0)
            JOB_STATUS[job_id] = {
                "progress": progress,
                "status": status,
                "leads": job.get("leads", []),
                "keyword": job.get("keyword", ""),
                "location": job.get("location", ""),
                "requested_leads": job.get("requested_leads", 0),
            }
        print(f"✅ Loaded {len(JOB_STATUS)} jobs from MongoDB")
    except Exception as e:
        print(f"⚠️ MongoDB load error: {e}")


def save_job(job_id: str, job_data: dict):
    """Upsert a single job in MongoDB"""
    try:
        jobs_collection.update_one(
            {"job_id": job_id},
            {"$set": {**job_data, "job_id": job_id}},
            upsert=True
        )
    except Exception as e:
        print(f"⚠️ MongoDB save error: {e}")


def save_jobs(jobs: dict):
    """Used for bulk operations"""
    try:
        jobs_collection.delete_many({})
        if jobs:
            docs = [{"job_id": k, **v} for k, v in jobs.items()]
            jobs_collection.insert_many(docs)
    except Exception as e:
        print(f"⚠️ MongoDB bulk save error: {e}")


def delete_job_from_db(job_id: str):
    """Delete a single job from MongoDB"""
    try:
        jobs_collection.delete_one({"job_id": job_id})
        print(f"🗑️ Deleted job {job_id} from MongoDB")
    except Exception as e:
        print(f"⚠️ MongoDB delete error: {e}")


def run_scrape_job_sync(query: str, count: int = 10, job_id: str = None):
    print(f"🔵 Starting scrape: {query}, count: {count}")

    if job_id:
        JOB_STATUS[job_id]["progress"] = 10
        JOB_STATUS[job_id]["status"] = "scraping"
        save_job(job_id, JOB_STATUS[job_id])
        time.sleep(1)

        JOB_STATUS[job_id]["progress"] = 30
        save_job(job_id, JOB_STATUS[job_id])
        time.sleep(0.5)

        JOB_STATUS[job_id]["progress"] = 50
        save_job(job_id, JOB_STATUS[job_id])

    leads = scrape_google_maps(query, max_results=count)
    print(f"✅ Scraped {len(leads)} leads")

    if job_id and job_id in JOB_STATUS:
        JOB_STATUS[job_id]["progress"] = 80
        save_job(job_id, JOB_STATUS[job_id])
        time.sleep(0.3)

        JOB_STATUS[job_id]["progress"] = 100
        JOB_STATUS[job_id]["status"] = "completed"
        JOB_STATUS[job_id]["leads"] = leads
        save_job(job_id, JOB_STATUS[job_id])

    print(f"🎉 Job completed with {len(leads)} results")
    return leads


# Load jobs from MongoDB on startup
load_jobs()