import uuid
from app.scrapers.google_maps import scrape_google_maps
from app.enrichment.email_finder import find_email
from app.enrichment.social_finder import find_socials
from app.enrichment.category_ai import detect_category
from app.enrichment.scoring import score_lead

JOB_STATUS = {}

def run_scrape_job(query: str, bg, count: int = 10):
    job_id = str(uuid.uuid4())
    JOB_STATUS[job_id] = {"progress": 0, "status": "running"}
    
    print(f"🔵 Starting job {job_id} for query: {query}, count: {count}")
    
    bg.add_task(process_job, job_id, query, count)
    return job_id

def process_job(job_id, query, count):
    print(f"🟢 Processing job {job_id}...")
    
    leads = scrape_google_maps(query, max_results=count)
    print(f"✅ Scraped {len(leads)} leads")
    
    results = []

    for i, lead in enumerate(leads):
        lead["email"] = find_email(lead.get("website"))
        lead["socials"] = find_socials(lead.get("website"))
        lead["category"] = detect_category(lead)
        lead["score"] = score_lead(lead)
        results.append(lead)

        JOB_STATUS[job_id]["progress"] = int(((i+1)/len(leads))*100)

    JOB_STATUS[job_id]["status"] = "completed"
    JOB_STATUS[job_id]["results"] = results
    
    print(f"🎉 Job {job_id} completed with {len(results)} results")

def run_scrape_job_sync(query: str, count: int = 10):
    """Synchronous version for immediate response"""
    print(f"🔵 Sync scraping for query: {query}, count: {count}")
    
    leads = scrape_google_maps(query, max_results=count)
    print(f"✅ Scraped {len(leads)} leads")
    
    results = []
    
    for lead in leads:
        lead["email"] = find_email(lead.get("website"))
        lead["socials"] = find_socials(lead.get("website"))
        lead["category"] = detect_category(lead)
        lead["score"] = score_lead(lead)
        results.append(lead)
    
    print(f"🎉 Sync job completed with {len(results)} results")
    return results