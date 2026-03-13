from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")

db = client["prospectminer"]

jobs_collection = db["jobs"]

def get_db():
    return db
users_collection = db["users"]
