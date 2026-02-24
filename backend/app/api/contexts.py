from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.cache import cache
from app.k8s.client import k8s_manager

router = APIRouter(prefix="/api/contexts", tags=["contexts"])


class SwitchContextRequest(BaseModel):
    name: str


@router.get("/")
async def list_contexts():
    return k8s_manager.list_contexts()


@router.get("/current")
async def get_current_context():
    ctx = k8s_manager.get_current_context()
    if not ctx:
        raise HTTPException(status_code=503, detail="No kubeconfig loaded")
    cluster_info = k8s_manager.get_cluster_info()
    return {**ctx, "cluster_info": cluster_info}


@router.post("/switch")
async def switch_context(req: SwitchContextRequest):
    try:
        cache.clear()
        result = k8s_manager.switch_context(req.name)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
