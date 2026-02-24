import asyncio
from fastapi import APIRouter, HTTPException

from app.k8s.client import k8s_manager
from app.k8s.resources import list_resources
from app.cache import cache

router = APIRouter(prefix="/api/namespaces", tags=["namespaces"])


@router.get("/")
async def list_namespaces():
    cached = cache.get("namespaces")
    if cached:
        return cached

    def _list():
        result = k8s_manager.core_v1.list_namespace()
        return [ns.metadata.name for ns in result.items]

    namespaces = await asyncio.to_thread(_list)
    cache.set("namespaces", namespaces)
    return namespaces


@router.get("/{name}/summary")
async def namespace_summary(name: str):
    cache_key = f"ns_summary:{name}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    def _summary():
        pods = list_resources("pods", name)
        deployments = list_resources("deployments", name)
        services = list_resources("services", name)
        configmaps = list_resources("configmaps", name)
        secrets = list_resources("secrets", name)
        return {
            "namespace": name,
            "pods": pods["total"],
            "deployments": deployments["total"],
            "services": services["total"],
            "configmaps": configmaps["total"],
            "secrets": secrets["total"],
        }

    result = await asyncio.to_thread(_summary)
    cache.set(cache_key, result, ttl=15)
    return result
