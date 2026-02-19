import re
from app.scrapers.website import get_page_html

def find_email(url):
    if not url:
        return None
    html = get_page_html(url)
    match = re.search(r"[\\w\\.-]+@[\\w\\.-]+", html)
    return match.group(0) if match else None
