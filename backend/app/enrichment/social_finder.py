def find_socials(url):
    if not url:
        return []
    socials = []
    if "facebook" in url:
        socials.append("facebook")
    return socials
