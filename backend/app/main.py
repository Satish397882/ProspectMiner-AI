from fastapi import FastAPI
from app.api.scrape import router as scrape_router

app = FastAPI(title="ProspectMiner AI")

app.include_router(scrape_router)

@app.get("/")
def health():
    return {"status": "ok"}
