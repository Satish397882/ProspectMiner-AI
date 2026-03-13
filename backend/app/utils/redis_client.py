import redis
import os
from ..config import REDIS_URL

redis_client = redis.from_url(
    REDIS_URL or "redis://localhost:6379/0",
    decode_responses=True
)

pubsub = redis_client.pubsub()
