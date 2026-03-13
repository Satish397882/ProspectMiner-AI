from ..db.database import get_db

def check_credits(user_id: str):

    db = get_db()

    user = db.users.find_one({"id": user_id})

    if not user:
        raise Exception("User not found")

    if user.get("credits", 0) <= 0:
        raise Exception("No credits remaining")


def deduct_credit(user_id: str):

    db = get_db()

    db.users.update_one(
        {"id": user_id},
        {"$inc": {"credits": -1}}
    )