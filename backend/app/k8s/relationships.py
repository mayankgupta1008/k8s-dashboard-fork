from app.k8s.client import k8s_manager
from app.models import GraphNode, GraphEdge, ResourceGraph


def _node_id(kind: str, namespace: str | None, name: str) -> str:
    return f"{kind}/{namespace or 'cluster'}/{name}"


def build_resource_graph(namespace: str | None = None) -> ResourceGraph:
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    seen_nodes: set[str] = set()

    def add_node(kind: str, name: str, ns: str | None, status: str | None = None):
        nid = _node_id(kind, ns, name)
        if nid not in seen_nodes:
            seen_nodes.add(nid)
            nodes.append(GraphNode(id=nid, kind=kind, name=name, namespace=ns, status=status))
        return nid

    def add_edge(source: str, target: str, relationship: str):
        edges.append(GraphEdge(source=source, target=target, relationship=relationship))

    try:
        # Fetch core resources
        if namespace:
            pods = k8s_manager.core_v1.list_namespaced_pod(namespace).items
            services = k8s_manager.core_v1.list_namespaced_service(namespace).items
            deployments = k8s_manager.apps_v1.list_namespaced_deployment(namespace).items
            replicasets = k8s_manager.apps_v1.list_namespaced_replica_set(namespace).items
            statefulsets = k8s_manager.apps_v1.list_namespaced_stateful_set(namespace).items
            daemonsets = k8s_manager.apps_v1.list_namespaced_daemon_set(namespace).items
            configmaps = k8s_manager.core_v1.list_namespaced_config_map(namespace).items
            secrets = k8s_manager.core_v1.list_namespaced_secret(namespace).items
            try:
                ingresses = k8s_manager.networking_v1.list_namespaced_ingress(namespace).items
            except Exception:
                ingresses = []
        else:
            pods = k8s_manager.core_v1.list_pod_for_all_namespaces().items
            services = k8s_manager.core_v1.list_service_for_all_namespaces().items
            deployments = k8s_manager.apps_v1.list_deployment_for_all_namespaces().items
            replicasets = k8s_manager.apps_v1.list_replica_set_for_all_namespaces().items
            statefulsets = k8s_manager.apps_v1.list_stateful_set_for_all_namespaces().items
            daemonsets = k8s_manager.apps_v1.list_daemon_set_for_all_namespaces().items
            configmaps = k8s_manager.core_v1.list_config_map_for_all_namespaces().items
            secrets = k8s_manager.core_v1.list_secret_for_all_namespaces().items
            try:
                ingresses = k8s_manager.networking_v1.list_ingress_for_all_namespaces().items
            except Exception:
                ingresses = []

        # Index for lookups
        pod_by_labels: dict[str, list] = {}  # "ns:key=val" -> [pod_ids]

        # Add deployments
        for d in deployments:
            nid = add_node("Deployment", d.metadata.name, d.metadata.namespace,
                           f"{d.status.ready_replicas or 0}/{d.spec.replicas or 0}")
            # Deployment -> ReplicaSet via ownerReferences

        # Add replicasets
        for rs in replicasets:
            # Skip if replicas is 0 (old RS)
            if rs.spec.replicas == 0:
                continue
            nid = add_node("ReplicaSet", rs.metadata.name, rs.metadata.namespace,
                           f"{rs.status.ready_replicas or 0}/{rs.spec.replicas or 0}")
            # ownerReferences
            for ref in (rs.metadata.owner_references or []):
                owner_id = _node_id(ref.kind, rs.metadata.namespace, ref.name)
                if owner_id in seen_nodes:
                    add_edge(owner_id, nid, "owns")

        # Add statefulsets
        for ss in statefulsets:
            add_node("StatefulSet", ss.metadata.name, ss.metadata.namespace,
                     f"{ss.status.ready_replicas or 0}/{ss.spec.replicas or 0}")

        # Add daemonsets
        for ds in daemonsets:
            add_node("DaemonSet", ds.metadata.name, ds.metadata.namespace,
                     f"{ds.status.number_ready or 0}/{ds.status.desired_number_scheduled or 0}")

        # Add pods
        for pod in pods:
            pod_status = pod.status.phase if pod.status else "Unknown"
            nid = add_node("Pod", pod.metadata.name, pod.metadata.namespace, pod_status)

            # ownerReferences -> ReplicaSet, StatefulSet, DaemonSet, Job
            for ref in (pod.metadata.owner_references or []):
                owner_id = _node_id(ref.kind, pod.metadata.namespace, ref.name)
                if owner_id in seen_nodes:
                    add_edge(owner_id, nid, "owns")

            # Index pod labels for service matching
            if pod.metadata.labels:
                for k, v in pod.metadata.labels.items():
                    key = f"{pod.metadata.namespace}:{k}={v}"
                    pod_by_labels.setdefault(key, []).append(nid)

            # Volume mounts -> ConfigMap/Secret
            for vol in (pod.spec.volumes or []):
                if vol.config_map:
                    cm_id = _node_id("ConfigMap", pod.metadata.namespace, vol.config_map.name)
                    if cm_id not in seen_nodes:
                        add_node("ConfigMap", vol.config_map.name, pod.metadata.namespace)
                    add_edge(cm_id, nid, "mounts")
                if vol.secret:
                    sec_id = _node_id("Secret", pod.metadata.namespace, vol.secret.secret_name)
                    if sec_id not in seen_nodes:
                        add_node("Secret", vol.secret.secret_name, pod.metadata.namespace)
                    add_edge(sec_id, nid, "mounts")
                if vol.persistent_volume_claim:
                    pvc_id = _node_id("PersistentVolumeClaim", pod.metadata.namespace, vol.persistent_volume_claim.claim_name)
                    add_node("PersistentVolumeClaim", vol.persistent_volume_claim.claim_name, pod.metadata.namespace)
                    add_edge(pvc_id, nid, "mounts")

        # Add services and connect to pods via label selectors
        for svc in services:
            svc_id = add_node("Service", svc.metadata.name, svc.metadata.namespace, svc.spec.type)
            if svc.spec.selector:
                for k, v in svc.spec.selector.items():
                    key = f"{svc.metadata.namespace}:{k}={v}"
                    for pod_id in pod_by_labels.get(key, []):
                        add_edge(svc_id, pod_id, "selects")

        # Add ingresses and connect to services
        for ing in ingresses:
            ing_id = add_node("Ingress", ing.metadata.name, ing.metadata.namespace, "Active")
            if ing.spec.rules:
                for rule in ing.spec.rules:
                    if rule.http and rule.http.paths:
                        for path in rule.http.paths:
                            if path.backend and path.backend.service:
                                svc_id = _node_id("Service", ing.metadata.namespace, path.backend.service.name)
                                if svc_id in seen_nodes:
                                    add_edge(ing_id, svc_id, "routes")

    except Exception as e:
        # Return partial graph on error
        pass

    return ResourceGraph(nodes=nodes, edges=edges)
