from fastapi import APIRouter, BackgroundTasks
from app.workers.job_runner import run_scrape_job, JOB_STATUS

router = APIRouter(prefix="/scrape", tags=["Scraping"])

@router.post("/")
def start_scrape(query: str, bg: BackgroundTasks):
    job_id = run_scrape_job(query, bg)
    return {"job_id": job_id}

@router.get("/{job_id}")
def get_status(job_id: str):
    return JOB_STATUS.get(job_id, {"status": "unknown"})
