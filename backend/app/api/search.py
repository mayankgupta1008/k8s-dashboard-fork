import asyncio
from fastapi import APIRouter, Query

from app.k8s.resources import list_resources, RESOURCE_REGISTRY

router = APIRouter(prefix="/api/search", tags=["search"])

SEARCHABLE_TYPES = [
    "pods", "deployments", "statefulsets", "daemonsets", "services",
    "ingresses", "configmaps", "secrets", "jobs", "cronjobs",
]


@router.get("")
async def search(
    q: str = Query(..., min_length=2),
    namespace: str | None = Query(None),
    kinds: list[str] | None = Query(None),
):
    search_types = kinds if kinds else SEARCHABLE_TYPES
    query = q.lower()

    def _search():
        results = []
        for resource_type in search_types:
            if resource_type not in RESOURCE_REGISTRY:
                continue
            data = list_resources(resource_type, namespace)
            for item in data.get("items", []):
                name_match = query in item["name"].lower()
                label_match = any(
                    query in f"{k}={v}".lower()
                    for k, v in (item.get("labels") or {}).items()
                )
                if name_match or label_match:
                    results.append(item)
        results.sort(key=lambda x: (
            0 if x["name"].lower().startswith(query) else 1,
            x["name"],
        ))
        return results[:50]

    return await asyncio.to_thread(_search)
