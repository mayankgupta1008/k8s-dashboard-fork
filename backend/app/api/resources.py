import asyncio
from fastapi import APIRouter, HTTPException, Query

from app.k8s.resources import (
    list_resources,
    get_resource,
    get_resource_yaml,
    get_resource_events,
    get_resource_types,
)

router = APIRouter(prefix="/api", tags=["resources"])


@router.get("/resource-types")
async def resource_types():
    return get_resource_types()


@router.get("/resources/{resource_type}")
async def list_resources_endpoint(
    resource_type: str,
    namespace: str | None = Query(None),
    label_selector: str | None = Query(None),
):
    result = await asyncio.to_thread(list_resources, resource_type, namespace, label_selector)
    return result


@router.get("/resources/{resource_type}/{name}")
async def get_resource_endpoint(
    resource_type: str,
    name: str,
    namespace: str | None = Query(None),
    reveal: bool = Query(False),
):
    result = await asyncio.to_thread(get_resource, resource_type, name, namespace, reveal)
    if not result:
        raise HTTPException(status_code=404, detail=f"{resource_type}/{name} not found")
    return result


@router.get("/resources/{resource_type}/{name}/yaml")
async def get_resource_yaml_endpoint(
    resource_type: str,
    name: str,
    namespace: str | None = Query(None),
):
    result = await asyncio.to_thread(get_resource_yaml, resource_type, name, namespace)
    if not result:
        raise HTTPException(status_code=404, detail=f"{resource_type}/{name} not found")
    return result


@router.get("/resources/{resource_type}/{name}/events")
async def get_resource_events_endpoint(
    resource_type: str,
    name: str,
    namespace: str | None = Query(None),
):
    result = await asyncio.to_thread(get_resource_events, resource_type, name, namespace)
    return result
