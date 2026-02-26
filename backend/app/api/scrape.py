from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.workers.job_runner import run_scrape_job_sync, JOB_STATUS, save_jobs, delete_job_from_db, jobs_collection, save_job
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
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("user_id")
    except Exception:
        return None


def get_user_jobs(user_id: str) -> dict:
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
        "cancelled": False,
    }
    thread = threading.Thread(target=run_scrape_job_sync, args=(query, request.leads, job_id))
    thread.daemon = True
    thread.start()
    return {"job_id": job_id, "status": "started"}


@router.get("/stats")
def get_job_stats(req: Request):
    user_id = get_user_id_from_request(req)
    memory_jobs = list(get_user_jobs(user_id).values())
    memory_job_ids = set(get_user_jobs(user_id).keys())
    all_jobs = list(memory_jobs)
    try:
        for job_data in jobs_collection.find({"user_id": user_id}):
            job_id = job_data.get("job_id") or str(job_data.get("_id"))
            if job_id not in memory_job_ids:
                all_jobs.append(job_data)
    except Exception as e:
        print(f"[STATS DB ERROR] {e}")

    total_leads = 0
    completed_jobs = 0
    active_jobs = 0
    for job_data in all_jobs:
        if job_data.get("status") == "completed":
            completed_jobs += 1
            total_leads += len(job_data.get("leads", []))
        elif job_data.get("status") in ["running", "scraping", "pending"]:
            active_jobs += 1

    total_jobs = len(all_jobs)
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
    memory_job_ids = set(user_job_dict.keys())
    all_jobs_dict = dict(user_job_dict)
    try:
        for job_data in jobs_collection.find({"user_id": user_id}):
            job_id = job_data.get("job_id") or str(job_data.get("_id"))
            if job_id not in memory_job_ids:
                all_jobs_dict[job_id] = job_data
    except Exception as e:
        print(f"[ANALYTICS DB ERROR] {e}")

    jobs = list(all_jobs_dict.values())

    leads_per_job = []
    for job_data in list(all_jobs_dict.values())[-8:]:
        keyword = job_data.get("keyword", "Unknown")
        location = job_data.get("location", "")
        leads_per_job.append({
            "name": f"{keyword[:12]}{'...' if len(keyword) > 12 else ''}, {location[:8]}",
            "leads": len(job_data.get("leads", [])),
            "requested": job_data.get("requested_leads", 0),
        })

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
                    job_date = datetime.fromisoformat(str(created_at))
                    if job_date.date() == day.date():
                        count += 1
                        if job_data.get("status") == "completed":
                            leads_count += len(job_data.get("leads", []))
                except:
                    pass
        days_data.append({"day": day_str, "jobs": count, "leads": leads_count})

    completed = sum(1 for j in jobs if j.get("status") == "completed")
    failed = sum(1 for j in jobs if j.get("status") in ["failed", "error"])
    running = sum(1 for j in jobs if j.get("status") in ["running", "scraping", "pending"])
    cancelled = sum(1 for j in jobs if j.get("status") == "cancelled")
    donut_data = []
    if completed: donut_data.append({"name": "Completed", "value": completed, "color": "#10b981"})
    if failed: donut_data.append({"name": "Failed", "value": failed, "color": "#ef4444"})
    if running: donut_data.append({"name": "Running", "value": running, "color": "#3b82f6"})
    if cancelled: donut_data.append({"name": "Cancelled", "value": cancelled, "color": "#f59e0b"})
    if not donut_data: donut_data.append({"name": "No Jobs", "value": 1, "color": "#e5e7eb"})

    keyword_counts = Counter(j.get("keyword", "Unknown") for j in jobs)
    top_keywords = [
        {"keyword": k, "count": v, "leads": sum(
            len(j.get("leads", [])) for j in jobs if j.get("keyword") == k
        )}
        for k, v in keyword_counts.most_common(6)
    ]

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
            "requested_leads": job_data.get("requested_leads", 0),
            "created_at": job_data.get("created_at", ""),
        })

    try:
        for job_data in jobs_collection.find({"user_id": user_id}):
            job_id = job_data.get("job_id") or str(job_data.get("_id"))
            if job_id in user_jobs:
                continue
            jobs.append({
                "job_id": job_id,
                "keyword": job_data.get("keyword", "Unknown"),
                "location": job_data.get("location", "Unknown"),
                "status": job_data.get("status", "unknown"),
                "progress": job_data.get("progress", 100),
                "leads_count": len(job_data.get("leads", [])),
                "requested_leads": job_data.get("requested_leads", 0),
                "created_at": str(job_data.get("created_at", "")),
            })
    except Exception as e:
        print(f"[DB ERROR] History load failed: {e}")

    return {"jobs": list(reversed(jobs))}


@router.post("/{job_id}/cancel")
def cancel_job(job_id: str, req: Request):
    user_id = get_user_id_from_request(req)
    job = JOB_STATUS.get(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if job.get("status") not in ["running", "scraping", "pending"]:
        raise HTTPException(status_code=400, detail="Job is not running")

    JOB_STATUS[job_id]["cancelled"] = True
    JOB_STATUS[job_id]["status"] = "cancelled"

    try:
        save_job(job_id, JOB_STATUS[job_id])
    except Exception as e:
        print(f"[CANCEL SAVE ERROR] {e}")

    return {"message": "Job cancelled successfully", "job_id": job_id}


@router.delete("/{job_id}")
def delete_job(job_id: str, req: Request):
    user_id = get_user_id_from_request(req)
    job = JOB_STATUS.get(job_id)

    if not job:
        try:
            db_job = jobs_collection.find_one({"job_id": job_id})
            if not db_job:
                raise HTTPException(status_code=404, detail="Job not found")
            if db_job.get("user_id") != user_id:
                raise HTTPException(status_code=403, detail="Not authorized to delete this job")
            delete_job_from_db(job_id)
            return {"message": "Job deleted successfully"}
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=404, detail="Job not found")

    if job.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")

    del JOB_STATUS[job_id]
    delete_job_from_db(job_id)
    return {"message": "Job deleted successfully"}


@router.get("/{job_id}/stream")
async def stream_progress(job_id: str, token: str = Query(None)):
    user_id = None
    if token:
        user_id = get_user_id_from_token(token)

    job = JOB_STATUS.get(job_id)
    if job and user_id and job.get("user_id") != user_id:
        async def forbidden():
            yield f"data: {json.dumps({'error': 'forbidden'})}\n\n"
        return StreamingResponse(forbidden(), media_type="text/event-stream")

    async def event_generator():
        max_wait = 600
        elapsed = 0
        yield f"data: {json.dumps({'progress': 0, 'status': 'connecting', 'leads_count': 0})}\n\n"
        while elapsed < max_wait:
            job = JOB_STATUS.get(job_id)
            if not job:
                yield f"data: {json.dumps({'progress': 0, 'status': 'waiting', 'leads_count': 0})}\n\n"
            else:
                yield f"data: {json.dumps({'progress': job['progress'], 'status': job['status'], 'leads_count': len(job.get('leads', []))})}\n\n"
                if job["status"] in ["completed", "cancelled", "failed", "error"]:
                    break
            await asyncio.sleep(0.5)
            elapsed += 0.5
        yield f"data: {json.dumps({'progress': 100, 'status': 'completed', 'leads_count': len(JOB_STATUS.get(job_id, {}).get('leads', []))})}\n\n"

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
        try:
            db_job = jobs_collection.find_one({"job_id": job_id})
            if not db_job:
                raise HTTPException(status_code=404, detail="Job not found")
            if db_job.get("user_id") != user_id:
                raise HTTPException(status_code=403, detail="Not authorized")
            db_job["_id"] = str(db_job["_id"])
            return {
                "job_id": job_id,
                "status": db_job.get("status", "unknown"),
                "progress": db_job.get("progress", 100),
                "leads": db_job.get("leads", []),
                "keyword": db_job.get("keyword", ""),
                "location": db_job.get("location", ""),
                "requested_leads": db_job.get("requested_leads", 0),
            }
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=404, detail="Job not found")

    if job.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return {
        "job_id": job_id,
        "status": job.get("status", "not_found"),
        "progress": job.get("progress", 0),
        "leads": job.get("leads", []),
        "keyword": job.get("keyword", ""),
        "location": job.get("location", ""),
        "requested_leads": job.get("requested_leads", 0),
    }