import asyncio
import json
import logging
from collections import defaultdict
from kubernetes import watch

from app.k8s.client import k8s_manager
from app.k8s.resources import RESOURCE_REGISTRY, _get_status, _age

logger = logging.getLogger(__name__)


class K8sWatcher:
    def __init__(self):
        self._subscribers: dict[str, set[asyncio.Queue]] = defaultdict(set)
        self._watch_tasks: dict[str, asyncio.Task] = {}
        self._running = True

    def subscribe(self, channel: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers[channel].add(queue)
        if channel not in self._watch_tasks or self._watch_tasks[channel].done():
            self._watch_tasks[channel] = asyncio.create_task(self._watch(channel))
        return queue

    def unsubscribe(self, channel: str, queue: asyncio.Queue):
        self._subscribers[channel].discard(queue)
        if not self._subscribers[channel]:
            task = self._watch_tasks.pop(channel, None)
            if task:
                task.cancel()

    async def _watch(self, channel: str):
        parts = channel.split(":", 1)
        resource_type = parts[0]
        namespace = parts[1] if len(parts) > 1 else None

        registry = RESOURCE_REGISTRY.get(resource_type)
        if not registry:
            return

        while self._running and self._subscribers.get(channel):
            try:
                w = watch.Watch()

                def _run_watch():
                    if namespace and registry["namespaced"]:
                        list_fn = registry["list"]
                        # Need to get the raw API call for watch
                        api_map = {
                            "pods": lambda: k8s_manager.core_v1.list_namespaced_pod,
                            "deployments": lambda: k8s_manager.apps_v1.list_namespaced_deployment,
                            "services": lambda: k8s_manager.core_v1.list_namespaced_service,
                            "configmaps": lambda: k8s_manager.core_v1.list_namespaced_config_map,
                            "secrets": lambda: k8s_manager.core_v1.list_namespaced_secret,
                            "replicasets": lambda: k8s_manager.apps_v1.list_namespaced_replica_set,
                            "statefulsets": lambda: k8s_manager.apps_v1.list_namespaced_stateful_set,
                            "daemonsets": lambda: k8s_manager.apps_v1.list_namespaced_daemon_set,
                            "ingresses": lambda: k8s_manager.networking_v1.list_namespaced_ingress,
                            "jobs": lambda: k8s_manager.batch_v1.list_namespaced_job,
                            "cronjobs": lambda: k8s_manager.batch_v1.list_namespaced_cron_job,
                            "events": lambda: k8s_manager.core_v1.list_namespaced_event,
                        }
                        fn = api_map.get(resource_type, lambda: None)()
                        if fn:
                            return list(w.stream(fn, namespace, timeout_seconds=300))
                    return []

                events = await asyncio.to_thread(_run_watch)

                for event in events:
                    event_type = event["type"]  # ADDED, MODIFIED, DELETED
                    obj = event["object"]
                    data = {
                        "type": event_type,
                        "resource_type": resource_type,
                        "name": obj.metadata.name,
                        "namespace": obj.metadata.namespace,
                        "status": _get_status(obj, resource_type),
                        "age": _age(obj.metadata.creation_timestamp),
                    }
                    message = json.dumps(data)
                    dead_queues = []
                    for q in self._subscribers.get(channel, set()):
                        try:
                            q.put_nowait(message)
                        except asyncio.QueueFull:
                            dead_queues.append(q)
                    for q in dead_queues:
                        self._subscribers[channel].discard(q)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning(f"Watch error for {channel}: {e}")
                await asyncio.sleep(5)

    async def shutdown(self):
        self._running = False
        for task in self._watch_tasks.values():
            task.cancel()


watcher = K8sWatcher()
