from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"


class ResourceItem(BaseModel):
    name: str
    namespace: str | None = None
    kind: str
    status: str | None = None
    age: str | None = None
    labels: dict[str, str] | None = None
    annotations: dict[str, str] | None = None
    raw: dict | None = None


class ResourceList(BaseModel):
    kind: str
    items: list[ResourceItem]
    total: int


class ResourceDetail(BaseModel):
    name: str
    namespace: str | None = None
    kind: str
    metadata: dict
    spec: dict | None = None
    status: dict | None = None
    raw: dict


class NamespaceSummary(BaseModel):
    namespace: str
    pods: int = 0
    deployments: int = 0
    services: int = 0
    configmaps: int = 0
    secrets: int = 0


class GraphNode(BaseModel):
    id: str
    kind: str
    name: str
    namespace: str | None = None
    status: str | None = None


class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: str  # owns, selects, mounts, routes


class ResourceGraph(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
