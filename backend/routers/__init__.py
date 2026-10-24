from backend.routers.bib_router import router as bib_router
from backend.routers.compiler_router import router as compiler_router
from backend.routers.git_router import router as git_router
from backend.routers.projects_router import router as projects_router
from backend.routers.stats_router import router as stats_router
from backend.routers.ws_router import router as ws_router

__all__ = [
    "bib_router",
    "compiler_router",
    "git_router",
    "projects_router",
    "stats_router",
    "ws_router",
]
