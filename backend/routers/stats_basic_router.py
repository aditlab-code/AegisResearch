import asyncio

from fastapi import APIRouter, HTTPException, status

from backend.routers.common import resolve_file_path, resolve_project_dir
from backend.routers.stats_plot_helper import _attach_concurrent_plot
from backend.schemas.stats_schemas import (
    CorrelationRequest,
    DescriptiveAnalysisRequest,
    ReliabilityAnalysisRequest,
    TTestIndependentRequest,
    TTestOneSampleRequest,
    TTestPairedRequest,
)
from backend.services.latex_table_gen import (
    generate_correlation_latex_table,
    generate_descriptive_latex_table,
    generate_multi_style_table,
    generate_reliability_latex_table,
    generate_ttest_latex_table,
)
from backend.services.stats import (
    StatsError,
    run_descriptive_analysis,
    run_reliability_analysis,
)
from backend.services.stats_nonparametric import run_correlation_spearman
from backend.services.stats_parametric import (
    run_correlation_pearson,
    run_ttest_independent,
    run_ttest_one_sample,
    run_ttest_paired,
)

router = APIRouter()


@router.post(
    "/api/projects/{name}/stats/descriptive",
    tags=["Statistics"],
)
async def analyze_descriptive(name: str, payload: DescriptiveAnalysisRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        results = await asyncio.to_thread(
            run_descriptive_analysis,
            target_file,
            payload.variables,
            payload.include_normality,
        )
        latex_tables = generate_multi_style_table(
            generate_descriptive_latex_table, results
        )
        out = {
            "analysis_type": "descriptive",
            "results": results,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
        return await _attach_concurrent_plot(
            project_dir, target_file, "descriptive", payload, out
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
    "/api/projects/{name}/stats/reliability",
    tags=["Statistics"],
)
async def analyze_reliability(name: str, payload: ReliabilityAnalysisRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_reliability_analysis,
            target_file,
            payload.items,
        )
        latex_tables = generate_multi_style_table(
            generate_reliability_latex_table,
            res["cronbach_alpha"],
            res["items_count"],
            res["sample_size"],
            res["item_stats"],
        )
        return {
            "analysis_type": "reliability",
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


@router.post(
    "/api/projects/{name}/stats/ttest/one-sample",
    tags=["Statistics"],
)
async def analyze_ttest_one_sample(name: str, payload: TTestOneSampleRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_ttest_one_sample,
            target_file,
            payload.variable,
            payload.test_value,
            payload.tests,
            payload.alternative,
            payload.missing_strategy,
        )
        latex_tables = generate_multi_style_table(generate_ttest_latex_table, res)
        out = {
            "analysis_type": "ttest_one_sample",
            **res,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
        return await _attach_concurrent_plot(
            project_dir, target_file, "ttest_one_sample", payload, out
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
    "/api/projects/{name}/stats/ttest/independent",
    tags=["Statistics"],
)
async def analyze_ttest_independent(name: str, payload: TTestIndependentRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_ttest_independent,
            target_file,
            payload.test_variable,
            payload.group_variable,
            payload.tests,
            payload.alternative,
            payload.missing_strategy,
        )
        latex_tables = generate_multi_style_table(generate_ttest_latex_table, res)
        out = {
            "analysis_type": "ttest_independent",
            **res,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
        return await _attach_concurrent_plot(
            project_dir, target_file, "ttest_independent", payload, out
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
    "/api/projects/{name}/stats/ttest/paired",
    tags=["Statistics"],
)
async def analyze_ttest_paired(name: str, payload: TTestPairedRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_ttest_paired,
            target_file,
            payload.var1,
            payload.var2,
            payload.tests,
            payload.alternative,
            payload.missing_strategy,
        )
        latex_tables = generate_multi_style_table(generate_ttest_latex_table, res)
        out = {
            "analysis_type": "ttest_paired",
            **res,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
        return await _attach_concurrent_plot(
            project_dir, target_file, "ttest_paired", payload, out
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
    "/api/projects/{name}/stats/correlation/pearson",
    tags=["Statistics"],
)
async def analyze_correlation_pearson(name: str, payload: CorrelationRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_correlation_pearson,
            target_file,
            payload.variables,
        )
        latex_tables = generate_multi_style_table(generate_correlation_latex_table, res)
        out = {
            "analysis_type": "correlation_pearson",
            **res,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
        return await _attach_concurrent_plot(
            project_dir, target_file, "correlation_pearson", payload, out
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
    "/api/projects/{name}/stats/nonparametric/spearman",
    tags=["Statistics"],
)
async def analyze_correlation_spearman(name: str, payload: CorrelationRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            run_correlation_spearman,
            target_file,
            payload.variables,
        )
        latex_tables = generate_multi_style_table(generate_correlation_latex_table, res)
        out = {
            "analysis_type": "correlation_spearman",
            **res,
            "latex_table": latex_tables["apa"],
            "latex_tables": latex_tables,
        }
        return await _attach_concurrent_plot(
            project_dir, target_file, "correlation_spearman", payload, out
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
