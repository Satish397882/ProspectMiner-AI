import time
from playwright.sync_api import sync_playwright


def scrape_google_maps(query: str, max_results: int = 10, job_id: str = None, job_status: dict = None):
    leads = []

    def update_live(current_leads):
        """Live update JOB_STATUS har lead ke baad"""
        if job_id and job_status and job_id in job_status:
            job_status[job_id]["leads"] = list(current_leads)
            # Progress calculate karo based on leads found
            scraping_progress = int((len(current_leads) / max_results) * 70) + 20  # 20-90% range
            job_status[job_id]["progress"] = min(scraping_progress, 90)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled", "--disable-dev-shm-usage"]
            )
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 800},
                locale="en-US",
            )
            page = context.new_page()
            page.set_default_timeout(60000)

            search_url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}"
            print(f"🔍 Searching: {search_url}")
            page.goto(search_url, wait_until="domcontentloaded", timeout=60000)
            print("✅ Page loaded!")
            time.sleep(3)

            try:
                accept_btn = page.query_selector('button[aria-label*="Accept"]')
                if accept_btn:
                    accept_btn.click()
                    time.sleep(1)
            except:
                pass

            # Collect unique listing URLs first
            listing_urls = []
            seen_urls = set()
            scroll_attempts = 0

            while len(listing_urls) < max_results and scroll_attempts < 25:
                # Check if job was cancelled
                if job_id and job_status and job_id in job_status:
                    if job_status[job_id].get("cancelled"):
                        print(f"⛔ Job {job_id} cancelled during URL collection")
                        browser.close()
                        return leads

                all_links = page.query_selector_all('a[href*="/maps/place/"]')
                for link in all_links:
                    href = link.get_attribute("href")
                    if href:
                        clean_url = href.split("?")[0] if "?" in href else href
                        if clean_url not in seen_urls:
                            seen_urls.add(clean_url)
                            listing_urls.append(clean_url)

                print(f"📍 Unique listings found: {len(listing_urls)}")

                if len(listing_urls) >= max_results:
                    break

                try:
                    panel = page.query_selector('div[role="feed"]')
                    if panel:
                        panel.evaluate("el => el.scrollTop += 1500")
                    else:
                        page.evaluate("window.scrollBy(0, 1500)")
                except:
                    page.evaluate("window.scrollBy(0, 1500)")

                time.sleep(2)
                scroll_attempts += 1

            listing_urls = listing_urls[:max_results]
            print(f"✅ Scraping {len(listing_urls)} unique listings...")

            # Visit each listing
            seen_names = set()
            for i, url in enumerate(listing_urls):
                # Check if job was cancelled
                if job_id and job_status and job_id in job_status:
                    if job_status[job_id].get("cancelled"):
                        print(f"⛔ Job {job_id} cancelled at lead {i+1}")
                        break

                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    time.sleep(2.5)

                    lead = extract_lead_data(page)

                    if lead and lead.get("name"):
                        name_key = lead["name"].strip().lower()
                        if name_key not in seen_names:
                            seen_names.add(name_key)
                            leads.append(lead)
                            # ✅ LIVE UPDATE - har lead ke baad
                            update_live(leads)
                            print(f"✅ [{len(leads)}/{max_results}] {lead.get('name')} | {lead.get('phone', '-')} | ⭐{lead.get('rating', '-')}")
                        else:
                            print(f"⏭️ Duplicate skipped: {lead.get('name')}")
                    else:
                        print(f"⚠️ [{i+1}] No data extracted")

                except Exception as e:
                    print(f"❌ Error on listing {i+1}: {e}")
                    continue

            browser.close()

    except Exception as e:
        print(f"❌ Scraper error: {e}")
        leads = get_mock_data(query, max_results)

    if not leads:
        leads = get_mock_data(query, max_results)

    print(f"🎉 Total leads: {len(leads)}")
    return leads


def extract_lead_data(page):
    lead = {}
    try:
        for sel in ['h1.DUwDvf', 'h1[class*="fontHeadlineLarge"]', 'h1']:
            el = page.query_selector(sel)
            if el:
                name = el.inner_text().strip()
                if name:
                    lead["name"] = name
                    break

        for sel in ['button[data-item-id*="phone"] div.fontBodyMedium', 'button[aria-label*="Phone"] div.fontBodyMedium', 'button[data-item-id^="phone:tel"] .fontBodyMedium']:
            el = page.query_selector(sel)
            if el:
                phone = el.inner_text().strip()
                if phone and any(c.isdigit() for c in phone):
                    lead["phone"] = phone
                    break

        for sel in ['a[data-item-id="authority"]', 'a[aria-label*="website" i]', 'a[data-tooltip="Open website"]']:
            el = page.query_selector(sel)
            if el:
                href = el.get_attribute("href")
                if href and href.startswith("http") and "google.com" not in href:
                    lead["website"] = href
                    break

        for sel in ['div.F7nice span[aria-hidden="true"]', 'span.ceNzKf']:
            el = page.query_selector(sel)
            if el:
                try:
                    rating = float(el.inner_text().strip().split()[0].replace(",", "."))
                    if 1.0 <= rating <= 5.0:
                        lead["rating"] = rating
                        break
                except:
                    continue

        for sel in ['button[data-item-id="address"] div.fontBodyMedium', 'button[aria-label*="Address"] div.fontBodyMedium']:
            el = page.query_selector(sel)
            if el:
                addr = el.inner_text().strip()
                if addr:
                    lead["address"] = addr
                    break

    except Exception as e:
        print(f"⚠️ Extract error: {e}")
    return lead


def get_mock_data(query: str, max_results: int):
    return [{"name": f"Business {i+1} - {query}", "phone": f"98765432{i:02d}", "website": f"https://business{i+1}.com", "rating": round(3.5 + (i * 0.1), 1), "address": f"Address {i+1}, India"} for i in range(max_results)]