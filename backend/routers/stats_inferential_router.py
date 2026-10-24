import asyncio

from fastapi import APIRouter, HTTPException, status

from backend.routers.common import resolve_file_path, resolve_project_dir
from backend.routers.stats_plot_helper import _attach_concurrent_plot
from backend.schemas.stats_schemas import (
    AncovaRequest,
    AnovaOneWayRequest,
    AnovaTwoWayRequest,
    ChiSquareIndependenceRequest,
    KruskalWallisRequest,
    MannWhitneyURequest,
    WilcoxonSignedRankRequest,
)
from backend.services.latex_table_gen import (
    generate_ancova_latex_table,
    generate_anova_latex_table,
    generate_chisquare_latex_table,
    generate_multi_style_table,
    generate_nonparametric_latex_table,
)
from backend.services.stats import StatsError
from backend.services.stats_nonparametric import (
    run_chisquare_independence,
    run_kruskal_wallis,
    run_mann_whitney_u,
    run_wilcoxon_signed_rank,
)
from backend.services.stats_parametric import (
    run_ancova,
    run_anova_oneway,
    run_anova_twoway,
)

router = APIRouter()


@router.post(
    "/api/projects/{name}/stats/anova/oneway",
    tags=["Statistics"],
)
async def analyze_anova_oneway(name: str, payload: AnovaOneWayRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_anova_oneway,
            target_file,
            payload.dependent,
            payload.factor,
            payload.post_hoc,
        )
        latex_tables = generate_multi_style_table(generate_anova_latex_table, res)
        out = {
            "analysis_type": "anova_oneway",
            **res,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
        return await _attach_concurrent_plot(
            project_dir, target_file, "anova_oneway", payload, out
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except (StatsError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.post(
    "/api/projects/{name}/stats/anova/twoway",
    tags=["Statistics"],
)
async def analyze_anova_twoway(name: str, payload: AnovaTwoWayRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_anova_twoway,
            target_file,
            payload.dependent,
            payload.factor1,
            payload.factor2,
        )
        latex_tables = generate_multi_style_table(generate_anova_latex_table, res)
        out = {
            "analysis_type": "anova_twoway",
            **res,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
        return await _attach_concurrent_plot(
            project_dir, target_file, "anova_twoway", payload, out
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except (StatsError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.post(
    "/api/projects/{name}/stats/ancova",
    tags=["Statistics"],
)
async def analyze_ancova(name: str, payload: AncovaRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_ancova,
            target_file,
            payload.dependent,
            payload.factor,
            payload.covariates,
        )
        latex_tables = generate_multi_style_table(generate_ancova_latex_table, res)
        out = {
            "analysis_type": "ancova",
            **res,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
        return await _attach_concurrent_plot(
            project_dir, target_file, "ancova", payload, out
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except (StatsError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.post(
    "/api/projects/{name}/stats/nonparametric/mann-whitney",
    tags=["Statistics"],
)
async def analyze_mann_whitney(name: str, payload: MannWhitneyURequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_mann_whitney_u,
            target_file,
            payload.test_variable,
            payload.group_variable,
        )
        latex_tables = generate_multi_style_table(
            generate_nonparametric_latex_table, res
        )
        out = {
            "analysis_type": "mann_whitney_u",
            **res,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
        return await _attach_concurrent_plot(
            project_dir, target_file, "mann_whitney", payload, out
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except (StatsError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.post(
    "/api/projects/{name}/stats/nonparametric/wilcoxon",
    tags=["Statistics"],
)
async def analyze_wilcoxon(name: str, payload: WilcoxonSignedRankRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_wilcoxon_signed_rank,
            target_file,
            payload.var1,
            payload.var2,
        )
        latex_tables = generate_multi_style_table(
            generate_nonparametric_latex_table, res
        )
        out = {
            "analysis_type": "wilcoxon_signed_rank",
            **res,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
        return await _attach_concurrent_plot(
            project_dir, target_file, "wilcoxon", payload, out
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except (StatsError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.post(
    "/api/projects/{name}/stats/nonparametric/kruskal",
    tags=["Statistics"],
)
async def analyze_kruskal(name: str, payload: KruskalWallisRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_kruskal_wallis,
            target_file,
            payload.test_variable,
            payload.group_variable,
        )
        latex_tables = generate_multi_style_table(
            generate_nonparametric_latex_table, res
        )
        out = {
            "analysis_type": "kruskal_wallis",
            **res,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
        return await _attach_concurrent_plot(
            project_dir, target_file, "kruskal", payload, out
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except (StatsError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.post(
    "/api/projects/{name}/stats/chisquare",
    tags=["Statistics"],
)
async def analyze_chisquare(name: str, payload: ChiSquareIndependenceRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_chisquare_independence,
            target_file,
            payload.row_variable,
            payload.col_variable,
        )
        latex_tables = generate_multi_style_table(generate_chisquare_latex_table, res)
        out = {
            "analysis_type": "chisquare_independence",
            **res,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
        return await _attach_concurrent_plot(
            project_dir, target_file, "chisquare", payload, out
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except (StatsError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e
