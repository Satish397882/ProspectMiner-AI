from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.scrape import router as scrape_router
from app.api.auth import router as auth_router

app = FastAPI(title="ProspectMiner AI")

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