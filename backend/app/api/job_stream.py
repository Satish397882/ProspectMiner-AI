from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from ..utils.redis_client import redis_client
import asyncio
import json

router = APIRouter()

async def event_generator(job_id: str):

    pubsub = redis_client.pubsub()
    pubsub.subscribe(f"job:{job_id}")

    while True:
        message = pubsub.get_message()

        if message and message["type"] == "message":

            yield {
                "event": "message",
                "data": message["data"]
            }

        await asyncio.sleep(1)


@router.get("/jobs/{job_id}/stream")
async def job_stream(job_id: str):

    return EventSourceResponse(event_generator(job_id))