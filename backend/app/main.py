from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models import HealthResponse
from app.api import contexts, resources, namespaces, events, logs, visualizer, search, ws
from app.k8s.watcher import watcher


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await watcher.shutdown()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contexts.router)
app.include_router(resources.router)
app.include_router(namespaces.router)
app.include_router(events.router)
app.include_router(logs.router)
app.include_router(visualizer.router)
app.include_router(search.router)
app.include_router(ws.router)


@app.get("/api/health", response_model=HealthResponse)
async def health():
    return HealthResponse()
