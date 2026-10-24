from fastapi import APIRouter, HTTPException, status

from backend.routers.common import resolve_file_path, resolve_project_dir
from backend.services.dataset import (
    DatasetError,
    get_dataset_schema,
    get_dataset_slice,
)

router = APIRouter()


@router.get(
    "/api/projects/{name}/dataset/schema",
    tags=["Dataset"],
)
async def get_project_dataset_schema(name: str, path: str):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, path)
    try:
        return get_dataset_schema(target_file)
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except DatasetError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.get(
    "/api/projects/{name}/dataset/slice",
    tags=["Dataset"],
)
async def get_project_dataset_slice(
    name: str,
    path: str,
    row_offset: int = 0,
    row_limit: int = 100,
    col_offset: int = 0,
    col_limit: int = 50,
):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, path)
    try:
        return get_dataset_slice(
            target_file,
            row_offset=row_offset,
            row_limit=row_limit,
            col_offset=col_offset,
            col_limit=col_limit,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except DatasetError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e
