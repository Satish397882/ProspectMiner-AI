def score_lead(lead):
    score = 0
    if lead.get("email"):
        score += 40
    if lead.get("website"):
        score += 30
    if lead.get("rating", 0) >= 4:
        score += 30

    if score >= 70:
        return "Hot"
    if score >= 40:
        return "Warm"
    return "Cold"
