import asyncio
from fastapi import APIRouter, Query

from app.k8s.client import k8s_manager
from app.k8s.resources import _format_event

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("")
async def list_events(
    namespace: str | None = Query(None),
    limit: int = Query(100),
):
    def _list():
        if namespace:
            result = k8s_manager.core_v1.list_namespaced_event(namespace)
        else:
            result = k8s_manager.core_v1.list_event_for_all_namespaces()

        events = [_format_event(e) for e in result.items]
        events.sort(key=lambda e: e["last_timestamp"] or "", reverse=True)
        return events[:limit]

    return await asyncio.to_thread(_list)
