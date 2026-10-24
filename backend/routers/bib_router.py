import asyncio

from fastapi import APIRouter, HTTPException, status

from backend.routers.common import resolve_file_path, resolve_project_dir
from backend.schemas.bib_schemas import (
    BibliometricsExportTikzRequest,
    BibliometricsLawsRequest,
    BibliometricsNetworkRequest,
    BibliometricsOverviewRequest,
    BibliometricsThematicEvolutionRequest,
    BibliometricsThematicMapRequest,
)
from backend.services.bibliometrics import (
    BibliometricError,
    compute_bibliometric_laws,
    compute_cooccurrence_network,
    compute_thematic_evolution,
    compute_thematic_map,
    generate_bibliometric_tikz,
    get_bibliometric_overview,
)

router = APIRouter()


@router.post(
    "/api/projects/{name}/bibliometrics/overview",
    tags=["Bibliometrics"],
)
async def api_bibliometrics_overview(name: str, payload: BibliometricsOverviewRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(get_bibliometric_overview, target_file)
        return res
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except (BibliometricError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.post(
    "/api/projects/{name}/bibliometrics/network",
    tags=["Bibliometrics"],
)
async def api_bibliometrics_network(name: str, payload: BibliometricsNetworkRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            compute_cooccurrence_network,
            target_file,
            payload.network_type,
            payload.min_frequency,
            payload.top_n,
            payload.exclude_keywords,
            payload.method,
        )
        return res
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except (BibliometricError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.post(
    "/api/projects/{name}/bibliometrics/thematic-map",
    tags=["Bibliometrics"],
)
async def api_bibliometrics_thematic_map(
    name: str, payload: BibliometricsThematicMapRequest
):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            compute_thematic_map,
            target_file,
            payload.network_type,
            payload.min_frequency,
            payload.top_n,
            payload.exclude_keywords,
        )
        tikz_code = generate_bibliometric_tikz("thematic_map", res)
        return {**res, "tikz_code": tikz_code}
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except (BibliometricError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.post(
    "/api/projects/{name}/bibliometrics/thematic-evolution",
    tags=["Bibliometrics"],
)
async def api_bibliometrics_thematic_evolution(
    name: str, payload: BibliometricsThematicEvolutionRequest
):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            compute_thematic_evolution,
            target_file,
            None,
            payload.slice_count,
            payload.min_frequency,
            payload.exclude_keywords,
        )
        return res
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except (BibliometricError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.post(
    "/api/projects/{name}/bibliometrics/laws",
    tags=["Bibliometrics"],
)
async def api_bibliometrics_laws(name: str, payload: BibliometricsLawsRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(compute_bibliometric_laws, target_file)
        bradford_tikz = generate_bibliometric_tikz("bradford", res)
        return {**res, "bradford_tikz": bradford_tikz}
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except (BibliometricError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.post(
    "/api/projects/{name}/bibliometrics/export-tikz",
    tags=["Bibliometrics"],
)
async def api_bibliometrics_export_tikz(
    name: str, payload: BibliometricsExportTikzRequest
):
    try:
        tikz = generate_bibliometric_tikz(payload.graph_type, payload.data)
        return {"tikz_code": tikz}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
