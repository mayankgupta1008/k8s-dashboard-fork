from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "K8s Dashboard"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    kubeconfig_path: str | None = None  # None = default ~/.kube/config
    cache_ttl: int = 30  # seconds
    log_tail_lines: int = 1000
    watch_timeout: int = 300  # seconds

    model_config = {"env_prefix": "K8S_DASH_"}


settings = Settings()
