import asyncio

from fastapi import APIRouter, HTTPException, status

from backend.routers.common import resolve_file_path, resolve_project_dir
from backend.routers.stats_plot_helper import _attach_concurrent_plot
from backend.schemas.stats_schemas import (
    LogisticRegressionRequest,
    ManovaAnalysisRequest,
    PcaAnalysisRequest,
    RegressionAnalysisRequest,
)
from backend.services.latex_table_gen import (
    generate_logistic_regression_latex_table,
    generate_manova_latex_table,
    generate_multi_style_table,
    generate_pca_latex_table,
    generate_regression_latex_table,
)
from backend.services.stats import (
    StatsError,
    run_manova_analysis,
    run_pca_analysis,
    run_regression_analysis,
)
from backend.services.stats_logistic import run_logistic_regression

router = APIRouter()


@router.post(
    "/api/projects/{name}/stats/regression",
    tags=["Statistics"],
)
async def analyze_regression(name: str, payload: RegressionAnalysisRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_regression_analysis,
            target_file,
            payload.dependent,
            payload.independents,
            payload.check_vif,
            payload.check_durbin_watson,
        )
        latex_tables = generate_multi_style_table(
            generate_regression_latex_table,
            res["dependent"],
            res["r"],
            res["r_squared"],
            res["adj_r_squared"],
            res["f_statistic"],
            res["f_p_value"],
            res["coefficients"],
        )
        out = {
            "analysis_type": "regression",
            **res,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
        return await _attach_concurrent_plot(
            project_dir, target_file, "regression", payload, out
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
    "/api/projects/{name}/stats/logistic",
    tags=["Statistics"],
)
async def analyze_logistic_regression(name: str, payload: LogisticRegressionRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_logistic_regression,
            target_file,
            payload.dependent,
            payload.independents,
            payload.cutoff,
            payload.missing_strategy,
        )
        latex_tables = generate_multi_style_table(
            generate_logistic_regression_latex_table,
            res["dependent"],
            res["coefficients"],
            res,
            res.get("classification"),
        )
        out = {
            "analysis_type": "logistic_regression",
            **res,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
        return await _attach_concurrent_plot(
            project_dir, target_file, "logistic_regression", payload, out
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
    "/api/projects/{name}/stats/manova",
    tags=["Statistics"],
)
async def analyze_manova(name: str, payload: ManovaAnalysisRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_manova_analysis,
            target_file,
            payload.dependents,
            payload.factor,
        )
        latex_tables = generate_multi_style_table(
            generate_manova_latex_table,
            res["factor"],
            res["dependents"],
            res["tests"],
        )
        out = {
            "analysis_type": "manova",
            **res,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
        return await _attach_concurrent_plot(
            project_dir, target_file, "manova", payload, out
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
    "/api/projects/{name}/stats/pca",
    tags=["Statistics"],
)
async def analyze_pca(name: str, payload: PcaAnalysisRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_pca_analysis,
            target_file,
            payload.variables,
            payload.n_components,
        )
        latex_tables = generate_multi_style_table(
            generate_pca_latex_table,
            res["loadings"],
            res["explained_variance_ratio"],
            res["eigenvalues"],
        )
        return {
            "analysis_type": "pca",
            **res,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
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
