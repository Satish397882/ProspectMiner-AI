from fastapi import APIRouter, Request, HTTPException
from ..db.database import get_db
from ..utils.auth import get_user_id_from_request

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("/")
def get_jobs(
    req: Request,
    page: int = 1, 
    limit: int = 20, 
    status: str = None,
    keyword: str = None
):
    user_id = get_user_id_from_request(req)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = get_db()
    query = {"user_id": user_id}
    if status:
        query["status"] = status
    if keyword:
        query["keyword"] = {"$regex": keyword, "$options": "i"}

    jobs = list(
        db.jobs.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * limit)
        .limit(limit)
    )
    for job in jobs:
        job["_id"] = str(job["_id"])

    return {"jobs": jobs}
