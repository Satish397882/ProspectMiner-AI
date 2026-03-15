import time
from pymongo import MongoClient
from ..scrapers.google_maps import scrape_google_maps
from ..utils.redis_client import redis_client
import json
import os
from datetime import datetime

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/prospectminer")
client = MongoClient(MONGODB_URI)
db = client.get_database("prospectminer")
jobs_collection = db["jobs"]

JOB_STATUS = {}


def load_jobs():
    try:
        for job in jobs_collection.find({}):
            job_id = job.get("job_id") or str(job.get("_id"))
            status = job.get("status", "unknown")
            progress = 100 if status == "completed" else job.get("progress", 0)
            JOB_STATUS[job_id] = {
                "progress": progress,
                "status": status,
                "leads": job.get("leads", []),
                "keyword": job.get("keyword", ""),
                "location": job.get("location", ""),
                "requested_leads": job.get("requested_leads", 0),
                "created_at": str(job.get("created_at", "")),
                "user_id": job.get("user_id", ""),
                "cancelled": False,
            }
        print(f"✅ Loaded {len(JOB_STATUS)} jobs from MongoDB")
    except Exception as e:
        print(f"⚠️ MongoDB load error: {e}")


def save_job(job_id: str, job_data: dict):
    try:
        jobs_collection.update_one(
            {"job_id": job_id},
            {"$set": {**job_data, "job_id": job_id}},
            upsert=True
        )
    except Exception as e:
        print(f"⚠️ MongoDB save error: {e}")


def save_jobs(jobs: dict):
    try:
        jobs_collection.delete_many({})
        if jobs:
            docs = [{"job_id": k, **v} for k, v in jobs.items()]
            jobs_collection.insert_many(docs)
    except Exception as e:
        print(f"⚠️ MongoDB bulk save error: {e}")


def delete_job_from_db(job_id: str):
    try:
        jobs_collection.delete_one({"job_id": job_id})
        print(f"🗑️ Deleted job {job_id} from MongoDB")
    except Exception as e:
        print(f"⚠️ MongoDB delete error: {e}")


def publish_progress(job_id, stage, progress):
    redis_client.publish(
        f"job:{job_id}",
        json.dumps({
            "stage": stage,
            "progress": progress
        })
    )


def run_scrape_job_sync(query: str, count: int = 10, job_id: str = None):
    print(f"🔵 Starting scrape: {query}, count: {count}")

    if job_id:
        JOB_STATUS[job_id] = {
            "progress": 10,
            "status": "scraping",
            "leads": [],
            "cancelled": False,
        }
        publish_progress(job_id, "scraping", 10)
        save_job(job_id, {"progress": 10, "status": "scraping"})
        time.sleep(0.5)

        publish_progress(job_id, "scraping", 20)
        save_job(job_id, {"progress": 20})

    leads = scrape_google_maps(
        query,
        max_results=count,
        job_id=job_id,
        job_status=JOB_STATUS
    )
    print(f"✅ Scraped {len(leads)} leads")

    if job_id:
        if jobs_collection.find_one({"job_id": job_id, "cancelled": True}):
            print(f"⛔ Job {job_id} was cancelled")
            JOB_STATUS[job_id]["status"] = "cancelled"
            JOB_STATUS[job_id]["progress"] = 0
            save_job(job_id, {"progress": 0, "status": "cancelled", "leads": leads})
            return leads

        # ✅ In-memory + MongoDB + Redis sab update
        JOB_STATUS[job_id]["status"] = "completed"
        JOB_STATUS[job_id]["progress"] = 100
        JOB_STATUS[job_id]["leads"] = leads

        publish_progress(job_id, "completed", 100)
        save_job(job_id, {"progress": 100, "status": "completed", "leads": leads})

    print(f"🎉 Job completed with {len(leads)} results")
    return leads


load_jobs()