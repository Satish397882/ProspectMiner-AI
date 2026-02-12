from fastapi import FastAPI
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
import re
app = FastAPI(title="ProspectMiner AI")
class LeadRequest(BaseModel):
    url: str
@app.post("/scrape")
def scrape_lead(data: LeadRequest):
    response = requests.get(data.url, timeout=10)
    soup = BeautifulSoup(response.text, "html.parser")
    text = soup.get_text(" ")
    emails = list(set(re.findall(r"[\w\.-]+@[\w\.-]+", text)))
    title = soup.title.string if soup.title else "Unknown Company"
    return {
        "company_name": title,
        "website": data.url,
        "emails": emails[:5],
        "description": text[:500]
    }