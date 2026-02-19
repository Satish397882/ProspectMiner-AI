from playwright.sync_api import sync_playwright

def get_browser():
    p = sync_playwright().start()
    browser = p.chromium.launch(headless=True)
    return p, browser
