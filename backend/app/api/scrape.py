from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.workers.job_runner import run_scrape_job_sync, JOB_STATUS, save_jobs, delete_job_from_db
import asyncio
import json
import uuid
import threading
import jwt
import os
from datetime import datetime, timedelta
from collections import Counter

router = APIRouter(prefix="/scrape", tags=["Scraping"])

SECRET_KEY = os.getenv("JWT_SECRET", "navya_jain_prospectminer_2025_secret_xyz123")
ALGORITHM = "HS256"


def get_user_id_from_request(request: Request) -> str | None:
    """Extract user_id from JWT token in Authorization header"""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("user_id")
    except Exception:
        return None


def get_user_id_from_token(token: str) -> str | None:
    """Extract user_id from JWT token string directly"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("user_id")
    except Exception:
        return None


def get_user_jobs(user_id: str) -> dict:
    """Get only jobs belonging to this user"""
    if not user_id:
        return {}
    return {
        job_id: job_data
        for job_id, job_data in JOB_STATUS.items()
        if job_data.get("user_id") == user_id
    }


class ScrapeRequest(BaseModel):
    keyword: str
    location: str
    leads: int = 10


@router.post("/")
def start_scrape(request: ScrapeRequest, req: Request):
    user_id = get_user_id_from_request(req)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    query = f"{request.keyword} in {request.location}"
    job_id = str(uuid.uuid4())
    JOB_STATUS[job_id] = {
        "progress": 0,
        "status": "running",
        "leads": [],
        "keyword": request.keyword,
        "location": request.location,
        "requested_leads": request.leads,
        "created_at": datetime.utcnow().isoformat(),
        "user_id": user_id,
    }
    thread = threading.Thread(target=run_scrape_job_sync, args=(query, request.leads, job_id))
    thread.daemon = True
    thread.start()
    return {"job_id": job_id, "status": "started"}


@router.get("/stats")
def get_job_stats(req: Request):
    user_id = get_user_id_from_request(req)
    user_jobs = list(get_user_jobs(user_id).values())

    total_leads = 0
    completed_jobs = 0
    active_jobs = 0
    for job_data in user_jobs:
        if job_data.get("status") == "completed":
            completed_jobs += 1
            total_leads += len(job_data.get("leads", []))
        elif job_data.get("status") in ["running", "scraping", "pending"]:
            active_jobs += 1

    total_jobs = len(user_jobs)
    success_rate = (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0
    return {
        "total_leads": total_leads,
        "active_jobs": active_jobs,
        "completed_jobs": completed_jobs,
        "total_jobs": total_jobs,
        "success_rate": round(success_rate, 1)
    }


@router.get("/analytics")
def get_analytics(req: Request):
    user_id = get_user_id_from_request(req)
    user_job_dict = get_user_jobs(user_id)
    jobs = list(user_job_dict.values())

    # Leads per job (last 8)
    leads_per_job = []
    for job_data in list(user_job_dict.values())[-8:]:
        keyword = job_data.get("keyword", "Unknown")
        location = job_data.get("location", "")
        leads_per_job.append({
            "name": f"{keyword[:12]}{'...' if len(keyword) > 12 else ''}, {location[:8]}",
            "leads": len(job_data.get("leads", [])),
            "requested": job_data.get("requested_leads", 0),
        })

    # Jobs over time (last 7 days)
    today = datetime.utcnow()
    days_data = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%b %d")
        count = 0
        leads_count = 0
        for job_data in jobs:
            created_at = job_data.get("created_at", "")
            if created_at:
                try:
                    job_date = datetime.fromisoformat(created_at)
                    if job_date.date() == day.date():
                        count += 1
                        if job_data.get("status") == "completed":
                            leads_count += len(job_data.get("leads", []))
                except:
                    pass
        days_data.append({"day": day_str, "jobs": count, "leads": leads_count})

    # Donut chart
    completed = sum(1 for j in jobs if j.get("status") == "completed")
    failed = sum(1 for j in jobs if j.get("status") == "failed")
    running = sum(1 for j in jobs if j.get("status") in ["running", "scraping", "pending"])
    donut_data = []
    if completed: donut_data.append({"name": "Completed", "value": completed, "color": "#10b981"})
    if failed: donut_data.append({"name": "Failed", "value": failed, "color": "#ef4444"})
    if running: donut_data.append({"name": "Running", "value": running, "color": "#3b82f6"})
    if not donut_data: donut_data.append({"name": "No Jobs", "value": 1, "color": "#e5e7eb"})

    # Top keywords
    keyword_counts = Counter(j.get("keyword", "Unknown") for j in jobs)
    top_keywords = [
        {"keyword": k, "count": v, "leads": sum(
            len(j.get("leads", [])) for j in jobs if j.get("keyword") == k
        )}
        for k, v in keyword_counts.most_common(6)
    ]

    # Summary
    total_leads = sum(len(j.get("leads", [])) for j in jobs if j.get("status") == "completed")
    avg_leads = round(total_leads / completed, 1) if completed > 0 else 0

    return {
        "leads_per_job": leads_per_job,
        "jobs_over_time": days_data,
        "donut_data": donut_data,
        "top_keywords": top_keywords,
        "summary": {
            "total_jobs": len(jobs),
            "completed_jobs": completed,
            "total_leads": total_leads,
            "avg_leads_per_job": avg_leads,
        }
    }


@router.get("/history")
def get_job_history(req: Request):
    user_id = get_user_id_from_request(req)
    user_jobs = get_user_jobs(user_id)

    jobs = []
    for job_id, job_data in user_jobs.items():
        jobs.append({
            "job_id": job_id,
            "keyword": job_data.get("keyword", "Unknown"),
            "location": job_data.get("location", "Unknown"),
            "status": job_data.get("status", "unknown"),
            "progress": job_data.get("progress", 0),
            "leads_count": len(job_data.get("leads", [])),
            "requested_leads": job_data.get("requested_leads", 0)
        })
    return {"jobs": list(reversed(jobs))}


@router.delete("/{job_id}")
def delete_job(job_id: str, req: Request):
    user_id = get_user_id_from_request(req)
    job = JOB_STATUS.get(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")

    del JOB_STATUS[job_id]
    delete_job_from_db(job_id)
    return {"message": "Job deleted successfully"}


@router.get("/{job_id}/stream")
async def stream_progress(job_id: str, token: str = Query(None)):
    # Token se user_id nikalo (SSE headers support nahi karta, isliye query param)
    user_id = None
    if token:
        user_id = get_user_id_from_token(token)

    # Job ownership verify karo
    job = JOB_STATUS.get(job_id)
    if job and user_id and job.get("user_id") != user_id:
        async def forbidden():
            yield f"data: {json.dumps({'error': 'forbidden'})}\n\n"
        return StreamingResponse(forbidden(), media_type="text/event-stream")

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

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
    )


@router.get("/{job_id}")
def get_status(job_id: str, req: Request):
    user_id = get_user_id_from_request(req)
    job = JOB_STATUS.get(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return {
        "job_id": job_id,
        "status": job.get("status", "not_found"),
        "progress": job.get("progress", 0),
        "leads": job.get("leads", [])
    }