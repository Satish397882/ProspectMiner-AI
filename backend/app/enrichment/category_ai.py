def detect_category(lead):
    name = lead.get("name", "").lower()
    if "hotel" in name:
        return "Hotel"
    if "clinic" in name:
        return "Medical"
    return "General Business"
