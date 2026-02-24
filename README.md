# K8s Dashboard

A read-only Kubernetes Dashboard web app for browsing cluster resources, viewing YAML/logs, and visualizing resource relationships — all powered by your local kubeconfig.

## Features

- **Resource Browsing** — Browse 22 resource types: Pods, Deployments, StatefulSets, DaemonSets, ReplicaSets, Jobs, CronJobs, Services, Ingresses, Endpoints, NetworkPolicies, ConfigMaps, Secrets, ServiceAccounts, PVs, PVCs, StorageClasses, Roles, RoleBindings, ClusterRoles, ClusterRoleBindings, Events
- **Resource Detail** — Tabbed view with Overview, YAML, Events, and Logs (for pods)
- **YAML Viewer** — Read-only YAML/JSON toggle with copy-to-clipboard
- **Pod Log Streaming** — Real-time SSE-based log streaming with container selector, search filter, and download
- **Cluster Visualizer** — Interactive graph (React Flow + dagre) showing Deployment→ReplicaSet→Pod ownership, Service→Pod selectors, ConfigMap/Secret→Pod mounts, and Ingress→Service routes
- **WebSocket Live Updates** — Background K8s watch streams push changes to the UI in real time
- **Global Search** — Ctrl+K to search across all resource types by name or label
- **Context Switching** — Switch between kubeconfig contexts from the header
- **Namespace Filtering** — Filter all views by namespace from the sidebar
- **Dark Mode** — Toggle with persistent preference
- **Secrets Masked** — Secret values hidden by default, revealable per-resource

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | Python 3.12, FastAPI, kubernetes-client, Pydantic, uvicorn |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router v6 |
| Data Fetching | TanStack React Query, WebSocket, SSE (EventSource) |
| Visualizer | @xyflow/react, @dagrejs/dagre |
| Containerization | Docker, docker-compose, nginx |

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- A valid `~/.kube/config` with at least one context

### Development

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — Vite proxies `/api` and `/ws` to the backend automatically.

### Docker

```bash
docker-compose up --build
```

Open http://localhost:3000

## Project Structure

```
k8s-dashboard/
├── docker-compose.yml
├── Makefile
├── backend/
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── app/
│       ├── main.py              # FastAPI app, CORS, router registration
│       ├── config.py            # Pydantic Settings (env: K8S_DASH_*)
│       ├── cache.py             # In-memory TTL cache
│       ├── models.py            # Pydantic response schemas
│       ├── k8s/
│       │   ├── client.py        # K8sClientManager (context switching)
│       │   ├── resources.py     # RESOURCE_REGISTRY + generic fetch/describe
│       │   ├── relationships.py # Resource relationship graph builder
│       │   └── watcher.py       # K8s Watch API → WebSocket bridge
│       └── api/
│           ├── contexts.py      # List/switch kubeconfig contexts
│           ├── namespaces.py    # List namespaces, summaries
│           ├── resources.py     # Generic CRUD for all resource types
│           ├── events.py        # Cluster events with filtering
│           ├── logs.py          # Pod logs (fetch + SSE streaming)
│           ├── visualizer.py    # Resource graph endpoint
│           ├── search.py        # Global search across resources
│           └── ws.py            # WebSocket endpoint for live updates
└── frontend/
    ├── package.json
    ├── vite.config.ts           # Proxy /api → backend
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── App.tsx              # Routes + QueryClient + dark mode
        ├── api/client.ts        # Fetch wrapper for all endpoints
        ├── api/hooks.ts         # React Query hooks
        ├── context/AppContext.tsx
        ├── types/k8s.ts
        ├── hooks/
        │   ├── useK8sWatch.ts   # WebSocket hook with auto-reconnect
        │   └── useKeyboardShortcuts.ts
        ├── components/
        │   ├── layout/          # AppShell, Header, Sidebar
        │   ├── common/          # StatusBadge, DataTable, GlobalSearch
        │   ├── resources/       # ResourceOverview, YamlViewer, EventsTable
        │   ├── visualizer/      # VisualizerGraph, K8sNode
        │   └── logs/            # LogViewer (fetch + SSE streaming)
        └── pages/
            ├── Dashboard.tsx
            ├── ResourceListPage.tsx
            ├── ResourceDetailPage.tsx
            ├── VisualizerPage.tsx
            └── EventsPage.tsx
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/contexts/` | List kubeconfig contexts |
| GET | `/api/contexts/current` | Current context + cluster info |
| POST | `/api/contexts/switch` | Switch active context |
| GET | `/api/namespaces/` | List namespaces |
| GET | `/api/namespaces/{name}/summary` | Namespace resource counts |
| GET | `/api/resources/{type}` | List resources (query: namespace, label_selector) |
| GET | `/api/resources/{type}/{name}` | Resource detail (query: namespace, reveal) |
| GET | `/api/resources/{type}/{name}/yaml` | Resource YAML |
| GET | `/api/resources/{type}/{name}/events` | Related events |
| GET | `/api/resource-types` | Available resource types |
| GET | `/api/pods/{ns}/{name}/logs` | Pod logs (query: container, tail_lines) |
| GET | `/api/pods/{ns}/{name}/logs/stream` | SSE streaming logs |
| GET | `/api/pods/{ns}/{name}/containers` | List pod containers |
| GET | `/api/events` | Cluster events (query: namespace, limit) |
| GET | `/api/visualizer/graph` | Resource relationship graph |
| GET | `/api/search` | Global search (query: q, namespace, kinds) |
| WS | `/ws/watch` | WebSocket for live resource updates |

## Configuration

Environment variables (prefix `K8S_DASH_`):

| Variable | Default | Description |
|----------|---------|-------------|
| `K8S_DASH_KUBECONFIG_PATH` | `~/.kube/config` | Path to kubeconfig |
| `K8S_DASH_CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins |
| `K8S_DASH_CACHE_TTL` | `30` | Cache TTL in seconds |
| `K8S_DASH_LOG_TAIL_LINES` | `1000` | Default log tail lines |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open global search |
| `R` | Refresh current view |

## Design Decisions

- **Generic Resource Registry** — One `RESOURCE_REGISTRY` dict maps all 22 resource types to K8s API methods. A single router handles everything instead of per-type endpoints.
- **Secrets masked by default** — Secret `.data` values replaced with `***masked***`. Pass `?reveal=true` to see actual values.
- **No database** — All data fetched live from the K8s API with a short-lived in-memory TTL cache.
- **SSE for logs, WebSocket for watches** — SSE is simpler for unidirectional log streaming; WebSocket enables bidirectional subscribe/unsubscribe for resource watches.
- **Dagre layout** — Automatic hierarchical graph layout for the cluster visualizer, with edge styles indicating relationship type (solid=owns, dashed=selects, dotted=mounts).
