import requests
from bs4 import BeautifulSoup

def get_page_html(url):
    try:
        return requests.get(url, timeout=10).text
    except:
        return ""
