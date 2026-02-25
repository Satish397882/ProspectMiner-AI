from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")

db = client["prospectminer"]

jobs_collection = db["jobs"]