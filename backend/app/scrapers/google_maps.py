def scrape_google_maps(query: str, max_results: int = 10):
    """
    Scrape Google Maps for business leads
    TODO: Implement real Playwright scraping
    For now, returns mock data
    """
    # MOCK DATA - returns multiple leads for testing
    mock_leads = []
    
    for i in range(max_results):  # Limit to requested count
        mock_leads.append({
            "name": f"Business {i+1} - {query}",
            "phone": f"98765432{i:02d}",
            "website": f"https://business{i+1}.com",
            "rating": round(3.5 + (i * 0.1), 1),
            "address": f"Address {i+1}, Delhi, India"
        })
    
    return mock_leads