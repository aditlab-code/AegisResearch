import os
from pathlib import Path
from typing import List

# Base backend directory
BASE_DIR: Path = Path(__file__).resolve().parent

# Workspace storage directory for LaTeX projects
WORKSPACE_DIR: Path = Path(
    os.getenv("WORKSPACE_DIR", str(BASE_DIR / "latex_workspaces"))
).resolve()
WORKSPACE_DIR.mkdir(parents=True, exist_ok=True)

# Allowed CORS origins
DEFAULT_CORS_ORIGINS: List[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

env_cors = os.getenv("CORS_ORIGINS")
if env_cors:
    CORS_ORIGINS: List[str] = [
        origin.strip() for origin in env_cors.split(",") if origin.strip()
    ]
else:
    CORS_ORIGINS: List[str] = DEFAULT_CORS_ORIGINS

HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", "8000"))
