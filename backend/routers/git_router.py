from fastapi import APIRouter

from backend.routers.git_branch_router import router as git_branch_router
from backend.routers.git_ops_router import router as git_ops_router

router = APIRouter()
router.include_router(git_ops_router)
router.include_router(git_branch_router)
