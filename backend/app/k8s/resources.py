import yaml
from datetime import datetime, timezone
from kubernetes.client import ApiException

from app.k8s.client import k8s_manager
from app.cache import cache

RESOURCE_REGISTRY = {
    "pods": {
        "kind": "Pod",
        "api_group": "core",
        "namespaced": True,
        "category": "Workloads",
        "list": lambda ns: k8s_manager.core_v1.list_namespaced_pod(ns) if ns else k8s_manager.core_v1.list_pod_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.core_v1.read_namespaced_pod(name, ns),
    },
    "deployments": {
        "kind": "Deployment",
        "api_group": "apps",
        "namespaced": True,
        "category": "Workloads",
        "list": lambda ns: k8s_manager.apps_v1.list_namespaced_deployment(ns) if ns else k8s_manager.apps_v1.list_deployment_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.apps_v1.read_namespaced_deployment(name, ns),
    },
    "statefulsets": {
        "kind": "StatefulSet",
        "api_group": "apps",
        "namespaced": True,
        "category": "Workloads",
        "list": lambda ns: k8s_manager.apps_v1.list_namespaced_stateful_set(ns) if ns else k8s_manager.apps_v1.list_stateful_set_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.apps_v1.read_namespaced_stateful_set(name, ns),
    },
    "daemonsets": {
        "kind": "DaemonSet",
        "api_group": "apps",
        "namespaced": True,
        "category": "Workloads",
        "list": lambda ns: k8s_manager.apps_v1.list_namespaced_daemon_set(ns) if ns else k8s_manager.apps_v1.list_daemon_set_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.apps_v1.read_namespaced_daemon_set(name, ns),
    },
    "replicasets": {
        "kind": "ReplicaSet",
        "api_group": "apps",
        "namespaced": True,
        "category": "Workloads",
        "list": lambda ns: k8s_manager.apps_v1.list_namespaced_replica_set(ns) if ns else k8s_manager.apps_v1.list_replica_set_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.apps_v1.read_namespaced_replica_set(name, ns),
    },
    "jobs": {
        "kind": "Job",
        "api_group": "batch",
        "namespaced": True,
        "category": "Workloads",
        "list": lambda ns: k8s_manager.batch_v1.list_namespaced_job(ns) if ns else k8s_manager.batch_v1.list_job_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.batch_v1.read_namespaced_job(name, ns),
    },
    "cronjobs": {
        "kind": "CronJob",
        "api_group": "batch",
        "namespaced": True,
        "category": "Workloads",
        "list": lambda ns: k8s_manager.batch_v1.list_namespaced_cron_job(ns) if ns else k8s_manager.batch_v1.list_cron_job_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.batch_v1.read_namespaced_cron_job(name, ns),
    },
    "services": {
        "kind": "Service",
        "api_group": "core",
        "namespaced": True,
        "category": "Networking",
        "list": lambda ns: k8s_manager.core_v1.list_namespaced_service(ns) if ns else k8s_manager.core_v1.list_service_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.core_v1.read_namespaced_service(name, ns),
    },
    "ingresses": {
        "kind": "Ingress",
        "api_group": "networking",
        "namespaced": True,
        "category": "Networking",
        "list": lambda ns: k8s_manager.networking_v1.list_namespaced_ingress(ns) if ns else k8s_manager.networking_v1.list_ingress_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.networking_v1.read_namespaced_ingress(name, ns),
    },
    "endpoints": {
        "kind": "Endpoints",
        "api_group": "core",
        "namespaced": True,
        "category": "Networking",
        "list": lambda ns: k8s_manager.core_v1.list_namespaced_endpoints(ns) if ns else k8s_manager.core_v1.list_endpoints_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.core_v1.read_namespaced_endpoints(name, ns),
    },
    "networkpolicies": {
        "kind": "NetworkPolicy",
        "api_group": "networking",
        "namespaced": True,
        "category": "Networking",
        "list": lambda ns: k8s_manager.networking_v1.list_namespaced_network_policy(ns) if ns else k8s_manager.networking_v1.list_network_policy_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.networking_v1.read_namespaced_network_policy(name, ns),
    },
    "configmaps": {
        "kind": "ConfigMap",
        "api_group": "core",
        "namespaced": True,
        "category": "Config & Storage",
        "list": lambda ns: k8s_manager.core_v1.list_namespaced_config_map(ns) if ns else k8s_manager.core_v1.list_config_map_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.core_v1.read_namespaced_config_map(name, ns),
    },
    "secrets": {
        "kind": "Secret",
        "api_group": "core",
        "namespaced": True,
        "category": "Config & Storage",
        "list": lambda ns: k8s_manager.core_v1.list_namespaced_secret(ns) if ns else k8s_manager.core_v1.list_secret_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.core_v1.read_namespaced_secret(name, ns),
    },
    "serviceaccounts": {
        "kind": "ServiceAccount",
        "api_group": "core",
        "namespaced": True,
        "category": "Access Control",
        "list": lambda ns: k8s_manager.core_v1.list_namespaced_service_account(ns) if ns else k8s_manager.core_v1.list_service_account_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.core_v1.read_namespaced_service_account(name, ns),
    },
    "pvs": {
        "kind": "PersistentVolume",
        "api_group": "core",
        "namespaced": False,
        "category": "Config & Storage",
        "list": lambda ns: k8s_manager.core_v1.list_persistent_volume(),
        "get": lambda name, ns: k8s_manager.core_v1.read_persistent_volume(name),
    },
    "pvcs": {
        "kind": "PersistentVolumeClaim",
        "api_group": "core",
        "namespaced": True,
        "category": "Config & Storage",
        "list": lambda ns: k8s_manager.core_v1.list_namespaced_persistent_volume_claim(ns) if ns else k8s_manager.core_v1.list_persistent_volume_claim_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.core_v1.read_namespaced_persistent_volume_claim(name, ns),
    },
    "storageclasses": {
        "kind": "StorageClass",
        "api_group": "storage",
        "namespaced": False,
        "category": "Config & Storage",
        "list": lambda ns: k8s_manager.storage_v1.list_storage_class(),
        "get": lambda name, ns: k8s_manager.storage_v1.read_storage_class(name),
    },
    "roles": {
        "kind": "Role",
        "api_group": "rbac",
        "namespaced": True,
        "category": "Access Control",
        "list": lambda ns: k8s_manager.rbac_v1.list_namespaced_role(ns) if ns else k8s_manager.rbac_v1.list_role_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.rbac_v1.read_namespaced_role(name, ns),
    },
    "rolebindings": {
        "kind": "RoleBinding",
        "api_group": "rbac",
        "namespaced": True,
        "category": "Access Control",
        "list": lambda ns: k8s_manager.rbac_v1.list_namespaced_role_binding(ns) if ns else k8s_manager.rbac_v1.list_role_binding_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.rbac_v1.read_namespaced_role_binding(name, ns),
    },
    "clusterroles": {
        "kind": "ClusterRole",
        "api_group": "rbac",
        "namespaced": False,
        "category": "Access Control",
        "list": lambda ns: k8s_manager.rbac_v1.list_cluster_role(),
        "get": lambda name, ns: k8s_manager.rbac_v1.read_cluster_role(name),
    },
    "clusterrolebindings": {
        "kind": "ClusterRoleBinding",
        "api_group": "rbac",
        "namespaced": False,
        "category": "Access Control",
        "list": lambda ns: k8s_manager.rbac_v1.list_cluster_role_binding(),
        "get": lambda name, ns: k8s_manager.rbac_v1.read_cluster_role_binding(name),
    },
    "events": {
        "kind": "Event",
        "api_group": "core",
        "namespaced": True,
        "category": "Cluster",
        "list": lambda ns: k8s_manager.core_v1.list_namespaced_event(ns) if ns else k8s_manager.core_v1.list_event_for_all_namespaces(),
        "get": lambda name, ns: k8s_manager.core_v1.read_namespaced_event(name, ns),
    },
}


def _age(creation: datetime | None) -> str:
    if not creation:
        return ""
    now = datetime.now(timezone.utc)
    delta = now - creation.replace(tzinfo=timezone.utc) if creation.tzinfo is None else now - creation
    seconds = int(delta.total_seconds())
    if seconds < 60:
        return f"{seconds}s"
    if seconds < 3600:
        return f"{seconds // 60}m"
    if seconds < 86400:
        return f"{seconds // 3600}h"
    return f"{seconds // 86400}d"


def _get_status(item: any, resource_type: str) -> str:
    try:
        if resource_type == "pods":
            return item.status.phase or "Unknown"
        if resource_type == "deployments":
            ready = item.status.ready_replicas or 0
            total = item.spec.replicas or 0
            return f"{ready}/{total}" if item.status else "0/0"
        if resource_type in ("statefulsets",):
            ready = item.status.ready_replicas or 0
            total = item.spec.replicas or 0
            return f"{ready}/{total}"
        if resource_type == "daemonsets":
            desired = item.status.desired_number_scheduled or 0
            ready = item.status.number_ready or 0
            return f"{ready}/{desired}"
        if resource_type == "services":
            return item.spec.type or "ClusterIP"
        if resource_type == "jobs":
            if item.status.succeeded:
                return "Succeeded"
            if item.status.failed:
                return "Failed"
            return "Running"
        if resource_type == "cronjobs":
            return "Active" if item.status.active else "Suspended" if item.spec.suspend else "Idle"
        if resource_type in ("pvs", "pvcs"):
            return item.status.phase or "Unknown"
        if resource_type == "ingresses":
            return "Active"
        if resource_type == "events":
            return item.type or "Normal"
    except (AttributeError, TypeError):
        pass
    return "Active"


def _to_dict(obj: any) -> dict:
    if hasattr(obj, 'to_dict'):
        return obj.to_dict()
    return obj


def _mask_secrets(raw: dict) -> dict:
    if raw.get("data"):
        raw["data"] = {k: "***masked***" for k in raw["data"]}
    return raw


def list_resources(resource_type: str, namespace: str | None = None, label_selector: str | None = None) -> dict:
    registry = RESOURCE_REGISTRY.get(resource_type)
    if not registry:
        return {"kind": resource_type, "items": [], "total": 0}

    cache_key = f"list:{resource_type}:{namespace}:{label_selector}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        result = registry["list"](namespace)
        items = []
        for item in result.items:
            raw = _to_dict(item)
            if resource_type == "secrets":
                raw = _mask_secrets(raw)
            items.append({
                "name": item.metadata.name,
                "namespace": item.metadata.namespace,
                "kind": registry["kind"],
                "status": _get_status(item, resource_type),
                "age": _age(item.metadata.creation_timestamp),
                "labels": item.metadata.labels,
                "annotations": item.metadata.annotations,
                "raw": None,  # Don't include raw in list for performance
            })

        if label_selector:
            # Client-side filtering since we already fetched
            parts = label_selector.split("=", 1)
            if len(parts) == 2:
                k, v = parts
                items = [i for i in items if i.get("labels", {}) and i["labels"].get(k) == v]

        response = {"kind": resource_type, "items": items, "total": len(items)}
        cache.set(cache_key, response)
        return response
    except ApiException as e:
        return {"kind": resource_type, "items": [], "total": 0, "error": str(e)}


def get_resource(resource_type: str, name: str, namespace: str | None = None, reveal: bool = False) -> dict | None:
    registry = RESOURCE_REGISTRY.get(resource_type)
    if not registry:
        return None

    try:
        item = registry["get"](name, namespace)
        raw = _to_dict(item)

        if resource_type == "secrets" and not reveal:
            raw = _mask_secrets(raw)

        metadata = raw.get("metadata", {})
        spec = raw.get("spec")
        status = raw.get("status")

        return {
            "name": item.metadata.name,
            "namespace": item.metadata.namespace,
            "kind": registry["kind"],
            "metadata": metadata,
            "spec": spec,
            "status": status,
            "raw": raw,
        }
    except ApiException as e:
        if e.status == 404:
            return None
        raise


def get_resource_yaml(resource_type: str, name: str, namespace: str | None = None) -> str:
    resource = get_resource(resource_type, name, namespace)
    if not resource:
        return ""
    raw = resource["raw"]
    # Clean up managed fields and last-applied-configuration for readability
    if "metadata" in raw and "managed_fields" in raw["metadata"]:
        del raw["metadata"]["managed_fields"]
    annotations = raw.get("metadata", {}).get("annotations", {})
    if annotations and "kubectl.kubernetes.io/last-applied-configuration" in annotations:
        del annotations["kubectl.kubernetes.io/last-applied-configuration"]
    return yaml.dump(raw, default_flow_style=False, sort_keys=False)


def get_resource_events(resource_type: str, name: str, namespace: str | None = None) -> list:
    if not namespace:
        return []
    try:
        events = k8s_manager.core_v1.list_namespaced_event(
            namespace,
            field_selector=f"involvedObject.name={name}"
        )
        return [_format_event(e) for e in events.items]
    except ApiException:
        return []


def _format_event(event: any) -> dict:
    return {
        "name": event.metadata.name,
        "namespace": event.metadata.namespace,
        "kind": "Event",
        "type": event.type,
        "reason": event.reason or "",
        "message": event.message or "",
        "source": f"{event.source.component or ''}" if event.source else "",
        "first_timestamp": event.first_timestamp.isoformat() if event.first_timestamp else None,
        "last_timestamp": event.last_timestamp.isoformat() if event.last_timestamp else None,
        "count": event.count or 0,
        "involved_object": {
            "kind": event.involved_object.kind if event.involved_object else "",
            "name": event.involved_object.name if event.involved_object else "",
            "namespace": event.involved_object.namespace if event.involved_object else "",
        },
    }


def get_resource_types() -> list:
    return [
        {
            "name": name,
            "kind": info["kind"],
            "api_group": info["api_group"],
            "namespaced": info["namespaced"],
            "category": info["category"],
        }
        for name, info in RESOURCE_REGISTRY.items()
    ]
