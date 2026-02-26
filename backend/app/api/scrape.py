from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.workers.job_runner import run_scrape_job_sync, JOB_STATUS, save_jobs, delete_job_from_db
import asyncio
import json
import uuid
import threading

router = APIRouter(prefix="/scrape", tags=["Scraping"])


class ScrapeRequest(BaseModel):
    keyword: str
    location: str
    leads: int = 10


@router.post("/")
def start_scrape(request: ScrapeRequest):
    query = f"{request.keyword} in {request.location}"
    job_id = str(uuid.uuid4())
    JOB_STATUS[job_id] = {"progress": 0, "status": "running", "leads": [], "keyword": request.keyword, "location": request.location, "requested_leads": request.leads}
    thread = threading.Thread(target=run_scrape_job_sync, args=(query, request.leads, job_id))
    thread.daemon = True
    thread.start()
    return {"job_id": job_id, "status": "started"}


@router.get("/stats")
def get_job_stats():
    total_leads = 0
    completed_jobs = 0
    active_jobs = 0
    for job_data in JOB_STATUS.values():
        if job_data.get("status") == "completed":
            completed_jobs += 1
            total_leads += len(job_data.get("leads", []))
        elif job_data.get("status") in ["running", "scraping", "pending"]:
            active_jobs += 1
    success_rate = (completed_jobs / len(JOB_STATUS) * 100) if len(JOB_STATUS) > 0 else 0
    return {"total_leads": total_leads, "active_jobs": active_jobs, "completed_jobs": completed_jobs, "total_jobs": len(JOB_STATUS), "success_rate": round(success_rate, 1)}


@router.get("/history")
def get_job_history():
    jobs = []
    for job_id, job_data in JOB_STATUS.items():
        jobs.append({"job_id": job_id, "keyword": job_data.get("keyword", "Unknown"), "location": job_data.get("location", "Unknown"), "status": job_data.get("status", "unknown"), "progress": job_data.get("progress", 0), "leads_count": len(job_data.get("leads", [])), "requested_leads": job_data.get("requested_leads", 0)})
    return {"jobs": list(reversed(jobs))}


@router.delete("/{job_id}")
def delete_job(job_id: str):
    if job_id not in JOB_STATUS:
        raise HTTPException(status_code=404, detail="Job not found")
    del JOB_STATUS[job_id]
    delete_job_from_db(job_id)
    return {"message": "Job deleted successfully"}


@router.get("/{job_id}/stream")
async def stream_progress(job_id: str):
    async def event_generator():
        max_wait = 600
        elapsed = 0
        yield f"data: {json.dumps({'progress': 0, 'status': 'connecting'})}\n\n"
        while elapsed < max_wait:
            job = JOB_STATUS.get(job_id)
            if not job:
                yield f"data: {json.dumps({'progress': 0, 'status': 'waiting'})}\n\n"
            else:
                yield f"data: {json.dumps({'progress': job['progress'], 'status': job['status']})}\n\n"
                if job["status"] == "completed":
                    break
            await asyncio.sleep(0.5)
            elapsed += 0.5
        yield f"data: {json.dumps({'progress': 100, 'status': 'completed'})}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"})


@router.get("/{job_id}")
def get_status(job_id: str):
    job = JOB_STATUS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"job_id": job_id, "status": job.get("status", "not_found"), "progress": job.get("progress", 0), "leads": job.get("leads", [])}