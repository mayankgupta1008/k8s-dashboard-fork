import asyncio
from fastapi import APIRouter, Query

from app.k8s.relationships import build_resource_graph
from app.cache import cache

router = APIRouter(prefix="/api/visualizer", tags=["visualizer"])


@router.get("/graph")
async def get_graph(namespace: str | None = Query(None)):
    cache_key = f"graph:{namespace}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    graph = await asyncio.to_thread(build_resource_graph, namespace)
    result = graph.model_dump()
    cache.set(cache_key, result, ttl=15)
    return result
