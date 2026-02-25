from fastapi import APIRouter
from pydantic import BaseModel
from app.workers.job_runner import run_scrape_job_sync

router = APIRouter(prefix="/scrape", tags=["Scraping"])

class ScrapeRequest(BaseModel):
    keyword: str
    location: str
    leads: int = 10
    count: int = 10

@router.post("/")
def start_scrape(request: ScrapeRequest):
    query = f"{request.keyword} in {request.location}"
    
    # Run synchronously (no background task)
    leads = run_scrape_job_sync(query, count=request.count)
    
    return {"job_id": "sync", "leads": leads}

@router.get("/{job_id}")
def get_status(job_id: str):
    return {"status": "completed"}