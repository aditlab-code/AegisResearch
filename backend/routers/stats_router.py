from fastapi import APIRouter

from backend.routers.stats_advanced_router import router as stats_advanced_router
from backend.routers.stats_basic_router import router as stats_basic_router
from backend.routers.stats_inferential_router import (
    router as stats_inferential_router,
)
from backend.routers.stats_plots_router import router as stats_plots_router

router = APIRouter()
router.include_router(stats_basic_router)
router.include_router(stats_inferential_router)
router.include_router(stats_advanced_router)
router.include_router(stats_plots_router)
