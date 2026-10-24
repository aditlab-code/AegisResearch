import asyncio

from fastapi import APIRouter, HTTPException, status

from backend.routers.common import resolve_file_path, resolve_project_dir
from backend.schemas.stats_schemas import (
    CriticalRegionPlotRequest,
    DistributionPlotRequest,
    GroupComparisonPlotRequest,
    MeanDifferencePlotRequest,
    RegressionPlotRequest,
    RocPlotRequest,
    StandardizedPlotRequest,
)
from backend.services.stats import StatsError
from backend.services.stats_plots import (
    generate_standardized_plot,
    plot_distribution_qq,
    plot_group_comparison,
    plot_hypothesis_critical_region,
    plot_mean_difference_ci,
    plot_regression_diagnostics,
    plot_roc_curve,
)

router = APIRouter()


@router.post(
    "/api/projects/{name}/stats/plots/generate",
    tags=["Statistics Plots"],
)
async def api_generate_standardized_plot(name: str, payload: StandardizedPlotRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            generate_standardized_plot,
            target_file,
            payload.plot_type,
            project_dir,
            dependent=payload.dependent,
            factor=payload.factor,
            factor2=payload.factor2,
            independents=payload.independents,
            variables=payload.variables,
            covariates=payload.covariates,
            var1=payload.var1,
            var2=payload.var2,
            test_value=payload.test_value,
            alternative=payload.alternative,
            cutoff=payload.cutoff,
        )
        return res
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
    "/api/projects/{name}/stats/plots/distribution",
    tags=["Statistics Plots"],
)
async def api_plot_distribution(name: str, payload: DistributionPlotRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            plot_distribution_qq, target_file, payload.variable, project_dir
        )
        return res
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
    "/api/projects/{name}/stats/plots/group-comparison",
    tags=["Statistics Plots"],
)
async def api_plot_group_comparison(name: str, payload: GroupComparisonPlotRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            plot_group_comparison,
            target_file,
            payload.dependent,
            payload.factor,
            project_dir,
        )
        return res
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
    "/api/projects/{name}/stats/plots/regression-diagnostics",
    tags=["Statistics Plots"],
)
async def api_plot_regression_diagnostics(name: str, payload: RegressionPlotRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            plot_regression_diagnostics,
            target_file,
            payload.dependent,
            payload.independents,
            project_dir,
        )
        return res
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
    "/api/projects/{name}/stats/plots/roc",
    tags=["Statistics Plots"],
)
async def api_plot_roc(name: str, payload: RocPlotRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            plot_roc_curve,
            target_file,
            payload.dependent,
            payload.independents,
            project_dir,
            payload.cutoff,
        )
        return res
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
    "/api/projects/{name}/stats/plots/mean-difference",
    tags=["Statistics Plots"],
)
async def api_plot_mean_difference(name: str, payload: MeanDifferencePlotRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            plot_mean_difference_ci,
            target_file,
            payload.test_variable,
            payload.group_variable,
            project_dir,
            payload.alternative,
        )
        return res
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
    "/api/projects/{name}/stats/plots/critical-region",
    tags=["Statistics Plots"],
)
async def api_plot_critical_region(name: str, payload: CriticalRegionPlotRequest):
    project_dir = resolve_project_dir(name)
    target_file = resolve_file_path(project_dir, payload.file_path)
    try:
        res = await asyncio.to_thread(
            plot_hypothesis_critical_region,
            target_file,
            payload.test_variable,
            payload.group_variable,
            project_dir,
            payload.test_value,
            payload.alternative,
        )
        return res
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
