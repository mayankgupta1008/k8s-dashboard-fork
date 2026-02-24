import asyncio
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from kubernetes.client import ApiException

from app.k8s.client import k8s_manager

router = APIRouter(prefix="/api/pods", tags=["logs"])


@router.get("/{namespace}/{name}/containers")
async def list_containers(namespace: str, name: str):
    def _list():
        try:
            pod = k8s_manager.core_v1.read_namespaced_pod(name, namespace)
        except ApiException as e:
            if e.status == 404:
                raise HTTPException(status_code=404, detail="Pod not found")
            raise

        containers = []
        for c in (pod.spec.containers or []):
            state = "waiting"
            ready = False
            restart_count = 0
            if pod.status and pod.status.container_statuses:
                for cs in pod.status.container_statuses:
                    if cs.name == c.name:
                        ready = cs.ready or False
                        restart_count = cs.restart_count or 0
                        if cs.state:
                            if cs.state.running:
                                state = "running"
                            elif cs.state.terminated:
                                state = "terminated"
                        break
            containers.append({
                "name": c.name,
                "image": c.image,
                "ready": ready,
                "restart_count": restart_count,
                "state": state,
            })

        for c in (pod.spec.init_containers or []):
            containers.append({
                "name": f"init:{c.name}",
                "image": c.image,
                "ready": False,
                "restart_count": 0,
                "state": "init",
            })

        return containers

    return await asyncio.to_thread(_list)


@router.get("/{namespace}/{name}/logs")
async def get_pod_logs(
    namespace: str,
    name: str,
    container: str | None = Query(None),
    tail_lines: int = Query(500),
    previous: bool = Query(False),
):
    def _logs():
        try:
            kwargs = {
                "name": name,
                "namespace": namespace,
                "tail_lines": tail_lines,
                "previous": previous,
            }
            if container:
                kwargs["container"] = container
            return k8s_manager.core_v1.read_namespaced_pod_log(**kwargs)
        except ApiException as e:
            if e.status == 404:
                raise HTTPException(status_code=404, detail="Pod not found")
            if "container" in str(e).lower():
                raise HTTPException(status_code=400, detail=str(e))
            raise

    return await asyncio.to_thread(_logs)


@router.get("/{namespace}/{name}/logs/stream")
async def stream_pod_logs(
    namespace: str,
    name: str,
    container: str | None = Query(None),
    tail_lines: int = Query(50),
):
    async def event_generator():
        import time

        def _watch():
            kwargs = {
                "name": name,
                "namespace": namespace,
                "follow": True,
                "tail_lines": tail_lines,
                "_preload_content": False,
            }
            if container:
                kwargs["container"] = container
            return k8s_manager.core_v1.read_namespaced_pod_log(**kwargs)

        try:
            stream = await asyncio.to_thread(_watch)
            loop = asyncio.get_event_loop()

            while True:
                line = await asyncio.to_thread(stream.readline)
                if not line:
                    break
                decoded = line.decode("utf-8", errors="replace").rstrip("\n")
                yield f"data: {decoded}\n\n"
        except Exception:
            yield "data: [stream ended]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
