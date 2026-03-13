from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from ..db.database import get_db
import pandas as pd
import io

router = APIRouter()

@router.get("/jobs/export")

def export_jobs(user_id: str):

    db = get_db()

    jobs = db.jobs.find({"userId": user_id})

    data = list(jobs)

    df = pd.DataFrame(data)

    stream = io.StringIO()

    df.to_csv(stream, index=False)

    response = StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv"
    )

    response.headers["Content-Disposition"] = "attachment; filename=jobs.csv"

    return response