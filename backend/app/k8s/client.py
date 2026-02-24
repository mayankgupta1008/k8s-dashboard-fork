from kubernetes import client, config
from kubernetes.config.config_exception import ConfigException


class K8sClientManager:
    def __init__(self, kubeconfig_path: str | None = None):
        self._kubeconfig_path = kubeconfig_path
        self._current_context: str | None = None
        self._api_client: client.ApiClient | None = None
        self._load_config()

    def _load_config(self, context: str | None = None) -> None:
        try:
            config.load_kube_config(
                config_file=self._kubeconfig_path,
                context=context,
            )
            _, active_context = config.list_kube_config_contexts(
                config_file=self._kubeconfig_path
            )
            self._current_context = active_context["name"]
            self._api_client = client.ApiClient()
        except ConfigException:
            self._current_context = None
            self._api_client = None

    def list_contexts(self) -> list[dict]:
        try:
            contexts, active = config.list_kube_config_contexts(
                config_file=self._kubeconfig_path
            )
            result = []
            for ctx in contexts:
                cluster = ctx.get("context", {}).get("cluster", "")
                user = ctx.get("context", {}).get("user", "")
                namespace = ctx.get("context", {}).get("namespace", "default")
                result.append({
                    "name": ctx["name"],
                    "cluster": cluster,
                    "user": user,
                    "namespace": namespace,
                    "active": ctx["name"] == active["name"],
                })
            return result
        except ConfigException:
            return []

    def get_current_context(self) -> dict | None:
        try:
            contexts, active = config.list_kube_config_contexts(
                config_file=self._kubeconfig_path
            )
            ctx = active.get("context", {})
            return {
                "name": active["name"],
                "cluster": ctx.get("cluster", ""),
                "user": ctx.get("user", ""),
                "namespace": ctx.get("namespace", "default"),
            }
        except ConfigException:
            return None

    def switch_context(self, context_name: str) -> dict:
        self._load_config(context=context_name)
        if self._current_context != context_name:
            raise ValueError(f"Failed to switch to context: {context_name}")
        return self.get_current_context()

    @property
    def core_v1(self) -> client.CoreV1Api:
        return client.CoreV1Api(self._api_client)

    @property
    def apps_v1(self) -> client.AppsV1Api:
        return client.AppsV1Api(self._api_client)

    @property
    def batch_v1(self) -> client.BatchV1Api:
        return client.BatchV1Api(self._api_client)

    @property
    def networking_v1(self) -> client.NetworkingV1Api:
        return client.NetworkingV1Api(self._api_client)

    @property
    def rbac_v1(self) -> client.RbacAuthorizationV1Api:
        return client.RbacAuthorizationV1Api(self._api_client)

    @property
    def storage_v1(self) -> client.StorageV1Api:
        return client.StorageV1Api(self._api_client)

    @property
    def api_client(self) -> client.ApiClient | None:
        return self._api_client

    @property
    def current_context(self) -> str | None:
        return self._current_context

    def get_cluster_info(self) -> dict:
        try:
            version = client.VersionApi(self._api_client).get_code()
            return {
                "version": f"{version.major}.{version.minor}",
                "platform": version.platform,
                "git_version": version.git_version,
            }
        except Exception:
            return {"version": "unknown", "platform": "unknown", "git_version": "unknown"}


k8s_manager = K8sClientManager()
