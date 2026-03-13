from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.scrape import router as scrape_router
from .api.auth import router as auth_router
from .api.job_stream import router as job_stream_router
from .api.export_jobs import router as export_router

app = FastAPI(title="ProspectMiner AI")

app.include_router(export_router)
app.include_router(job_stream_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(scrape_router)

@app.get("/")
def health():
    return {"status": "ok"}