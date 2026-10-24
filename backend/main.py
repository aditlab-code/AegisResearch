from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import CORS_ORIGINS, HOST, PORT, WORKSPACE_DIR
from backend.routers import (
    bib_router,
    compiler_router,
    git_router,
    projects_router,
    stats_router,
    ws_router,
)
from backend.routers.common import (
    SEARCH_IGNORED_EXTENSIONS,
    TEX_BUILD_ARTIFACT_EXTS,
    build_tree_node,
    get_file_kind,
    is_tex_artifact,
    resolve_file_path,
    resolve_project_dir,
)
from backend.schemas import *
from backend.services.os_dialog import pick_directory_native

app = FastAPI(
    title="Scholarly LaTeX Backend",
    version="0.1.1",
    description="Backend API for Scholarly LaTeX IDE",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.api_route("/", methods=["GET", "HEAD"], tags=["General"])
async def root():
    return {
        "status": "ok",
        "message": "Scholarly LaTeX IDE Backend",
        "version": "0.1.1",
    }


@app.api_route("/api/health", methods=["GET", "HEAD"], tags=["General"])
async def health_check():
    return {
        "status": "healthy",
        "cors": True,
        "workspace_dir": str(WORKSPACE_DIR),
        "allowed_origins": CORS_ORIGINS,
    }


# Include all modular feature routers
app.include_router(projects_router)
app.include_router(compiler_router)
app.include_router(git_router)
app.include_router(stats_router)
app.include_router(bib_router)
app.include_router(ws_router)


__all__ = [
    "SEARCH_IGNORED_EXTENSIONS",
    "TEX_BUILD_ARTIFACT_EXTS",
    "app",
    "build_tree_node",
    "get_file_kind",
    "is_tex_artifact",
    "pick_directory_native",
    "resolve_file_path",
    "resolve_project_dir",
]


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
