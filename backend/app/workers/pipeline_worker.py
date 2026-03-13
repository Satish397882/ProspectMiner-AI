from ..utils.redis_client import redis_client
from ..db.database import get_db
import json
import time


def publish_progress(job_id, stage, progress):

    redis_client.publish(
        f"job:{job_id}",
        json.dumps({
            "stage": stage,
            "progress": progress
        })
    )


def update_job(job_id, status, progress):

    db = get_db()

    db.jobs.update_one(
        {"_id": job_id},
        {
            "$set": {
                "status": status,
                "progress": progress
            }
        }
    )


def run_pipeline(job_id):

    try:

        # Stage 1: Scraping
        publish_progress(job_id, "scraping", 40)
        update_job(job_id, "scraping", 40)

        time.sleep(2)

        # Stage 2: Enrichment
        publish_progress(job_id, "enrichment", 80)
        update_job(job_id, "enrichment", 80)

        time.sleep(2)

        # Stage 3: Completed
        publish_progress(job_id, "completed", 100)
        update_job(job_id, "completed", 100)

    except Exception as e:

        publish_progress(job_id, "failed", 0)

        update_job(job_id, "failed", 0)

        print("Pipeline error:", str(e))