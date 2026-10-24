import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

BENCHMARK_CSV = "benchmark_audit_200.csv"


def test_api_descriptive():
    payload = {
        "file_path": BENCHMARK_CSV,
        "variables": ["study_hours", "exam_score"],
        "include_normality": True,
    }
    res = client.post("/api/projects/template-thesis/stats/descriptive", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["analysis_type"] == "descriptive"
    assert len(data["results"]) == 2
    assert "latex_table" in data
    assert r"\begin{table}" in data["latex_table"]


def test_api_regression():
    payload = {
        "file_path": BENCHMARK_CSV,
        "dependent": "exam_score",
        "independents": ["study_hours", "prior_gpa"],
        "check_vif": True,
        "check_durbin_watson": True,
    }
    res = client.post("/api/projects/template-thesis/stats/regression", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["analysis_type"] == "regression"
    assert data["dependent"] == "exam_score"
    assert "r_squared" in data
    assert len(data["coefficients"]) >= 3
    assert "latex_table" in data


def test_api_logistic_regression():
    payload = {
        "file_path": BENCHMARK_CSV,
        "dependent": "passed",
        "independents": ["study_hours", "prior_gpa"],
        "cutoff": 0.5,
    }
    res = client.post("/api/projects/template-thesis/stats/logistic", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["analysis_type"] == "logistic_regression"
    assert data["dependent"] == "passed"
    assert "model_chi2" in data
    assert "pseudo_r2" in data
    assert "classification" in data
    assert "auc" in data["classification"]
    assert len(data["coefficients"]) >= 3
    assert "latex_table" in data
    assert r"\begin{table}" in data["latex_table"]


def test_api_stats_file_not_found():
    payload = {
        "file_path": "non_existent_data.csv",
        "variables": ["exam_score"],
    }
    res = client.post("/api/projects/template-thesis/stats/descriptive", json=payload)
    assert res.status_code == 404


def test_api_ttest_one_sample():
    payload = {
        "file_path": BENCHMARK_CSV,
        "variable": "exam_score",
        "test_value": 75.0,
        "alternative": "greater",
        "missing_strategy": "pairwise",
    }
    res = client.post(
        "/api/projects/template-thesis/stats/ttest/one-sample", json=payload
    )
    assert res.status_code == 200
    data = res.json()
    assert data["analysis_type"] == "ttest_one_sample"
    assert data["alternative"] == "greater"
    assert "comparative_tests" in data
    assert len(data["comparative_tests"]) >= 2
    assert "latex_table" in data
    assert r"\begin{table}" in data["latex_table"]


def test_api_ttest_independent():
    payload = {
        "file_path": BENCHMARK_CSV,
        "test_variable": "exam_score",
        "group_variable": "group",
        "alternative": "two-sided",
    }
    res = client.post(
        "/api/projects/template-thesis/stats/ttest/independent", json=payload
    )
    assert res.status_code == 200
    data = res.json()
    assert data["analysis_type"] == "ttest_independent"
    assert "comparative_tests" in data
    assert r"\begin{table}" in data["latex_table"]


def test_api_correlation_pearson():
    payload = {
        "file_path": BENCHMARK_CSV,
        "variables": ["study_hours", "exam_score", "prior_gpa"],
    }
    res = client.post(
        "/api/projects/template-thesis/stats/correlation/pearson", json=payload
    )
    assert res.status_code == 200
    data = res.json()
    assert data["analysis_type"] == "correlation_pearson"
    assert len(data["matrix"]) == 3
    assert r"\begin{table}" in data["latex_table"]


def test_api_nonparametric_spearman():
    payload = {
        "file_path": BENCHMARK_CSV,
        "variables": ["study_hours", "exam_score"],
    }
    res = client.post(
        "/api/projects/template-thesis/stats/nonparametric/spearman", json=payload
    )
    assert res.status_code == 200
    data = res.json()
    assert data["analysis_type"] == "correlation_spearman"
    assert r"\begin{table}" in data["latex_table"]


def test_api_chisquare():
    payload = {
        "file_path": BENCHMARK_CSV,
        "row_variable": "group",
        "col_variable": "gender",
    }
    res = client.post("/api/projects/template-thesis/stats/chisquare", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["analysis_type"] == "chisquare_independence"
    assert "cramers_v" in data
    assert "crosstab" in data
    assert r"\begin{table}" in data["latex_table"]


def test_api_ancova():
    payload = {
        "file_path": BENCHMARK_CSV,
        "dependent": "exam_score",
        "factor": "group",
        "covariates": ["study_hours"],
    }
    res = client.post("/api/projects/template-thesis/stats/ancova", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["analysis_type"] == "ancova"
    assert "effects" in data
    assert "adjusted_means" in data
    assert r"\begin{table}" in data["latex_table"]


def test_api_plot_distribution():
    payload = {
        "file_path": BENCHMARK_CSV,
        "variable": "exam_score",
    }
    res = client.post(
        "/api/projects/template-thesis/stats/plots/distribution", json=payload
    )
    assert res.status_code == 200
    data = res.json()
    assert data["plot_type"] == "distribution_qq"
    assert "image_path" in data
    assert r"\begin{figure}" in data["latex_snippet"]


def test_api_plot_group_comparison():
    payload = {
        "file_path": BENCHMARK_CSV,
        "dependent": "exam_score",
        "factor": "group",
    }
    res = client.post(
        "/api/projects/template-thesis/stats/plots/group-comparison", json=payload
    )
    assert res.status_code == 200
    data = res.json()
    assert data["plot_type"] == "group_comparison"
    assert "image_path" in data
    assert r"\begin{figure}" in data["latex_snippet"]


def test_api_plot_regression_diagnostics():
    payload = {
        "file_path": BENCHMARK_CSV,
        "dependent": "exam_score",
        "independents": ["study_hours", "prior_gpa"],
    }
    res = client.post(
        "/api/projects/template-thesis/stats/plots/regression-diagnostics", json=payload
    )
    assert res.status_code == 200
    data = res.json()
    assert data["plot_type"] == "regression_diagnostics"
    assert "image_path" in data
    assert r"\begin{figure}" in data["latex_snippet"]


def test_api_plot_roc():
    payload = {
        "file_path": BENCHMARK_CSV,
        "dependent": "passed",
        "independents": ["study_hours", "prior_gpa"],
        "cutoff": 0.5,
    }
    res = client.post("/api/projects/template-thesis/stats/plots/roc", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["plot_type"] == "roc_curve"
    assert "auc" in data
    assert "image_path" in data
    assert r"\begin{figure}" in data["latex_snippet"]


def test_api_plot_mean_difference():
    payload = {
        "file_path": BENCHMARK_CSV,
        "test_variable": "exam_score",
        "group_variable": "group",
        "alternative": "two-sided",
    }
    res = client.post(
        "/api/projects/template-thesis/stats/plots/mean-difference", json=payload
    )
    assert res.status_code == 200
    data = res.json()
    assert data["plot_type"] == "mean_difference_ci"
    assert "difference" in data
    assert "image_path" in data
    assert r"\begin{figure}" in data["latex_snippet"]


def test_api_plot_critical_region():
    payload = {
        "file_path": BENCHMARK_CSV,
        "test_variable": "exam_score",
        "group_variable": "group",
        "test_value": 0.0,
        "alternative": "two-sided",
    }
    res = client.post(
        "/api/projects/template-thesis/stats/plots/critical-region", json=payload
    )
    assert res.status_code == 200
    data = res.json()
    assert data["plot_type"] == "hypothesis_critical_region"
    assert "t_obs" in data
    assert "image_path" in data
    assert r"\begin{figure}" in data["latex_snippet"]


def test_api_generate_standardized_plots():
    # 1. Distribution via unified endpoint (verifies Base64 dual-delivery)
    res = client.post(
        "/api/projects/template-thesis/stats/plots/generate",
        json={
            "file_path": BENCHMARK_CSV,
            "plot_type": "distribution_qq",
            "dependent": "exam_score",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["plot_type"] == "distribution_qq"
    assert data["image_data_url"].startswith("data:image/png;base64,")
    assert "image_path" in data

    # 2. Paired slopegraph
    res_paired = client.post(
        "/api/projects/template-thesis/stats/plots/generate",
        json={
            "file_path": BENCHMARK_CSV,
            "plot_type": "paired_slopegraph",
            "var1": "study_hours",
            "var2": "prior_gpa",
        },
    )
    assert res_paired.status_code == 200
    assert res_paired.json()["plot_type"] == "paired_slopegraph"
    assert res_paired.json()["image_data_url"].startswith("data:image/png;base64,")

    # 3. Two-way interaction
    res_inter = client.post(
        "/api/projects/template-thesis/stats/plots/generate",
        json={
            "file_path": BENCHMARK_CSV,
            "plot_type": "two_way_interaction",
            "dependent": "exam_score",
            "factor": "group",
            "factor2": "gender",
        },
    )
    assert res_inter.status_code == 200
    assert res_inter.json()["plot_type"] == "two_way_interaction"
    assert res_inter.json()["image_data_url"].startswith("data:image/png;base64,")

    # 4. ANCOVA means
    res_ancova = client.post(
        "/api/projects/template-thesis/stats/plots/generate",
        json={
            "file_path": BENCHMARK_CSV,
            "plot_type": "ancova_means",
            "dependent": "exam_score",
            "factor": "group",
            "covariates": ["study_hours"],
        },
    )
    assert res_ancova.status_code == 200
    assert res_ancova.json()["plot_type"] == "ancova_means"
    assert res_ancova.json()["image_data_url"].startswith("data:image/png;base64,")

    # 5. Correlation Heatmap
    res_corr = client.post(
        "/api/projects/template-thesis/stats/plots/generate",
        json={
            "file_path": BENCHMARK_CSV,
            "plot_type": "correlation_heatmap",
            "variables": ["study_hours", "exam_score", "prior_gpa"],
        },
    )
    assert res_corr.status_code == 200
    assert res_corr.json()["plot_type"] == "correlation_heatmap"
    assert res_corr.json()["image_data_url"].startswith("data:image/png;base64,")

    # 6. Chi-Square Mosaic
    res_chi = client.post(
        "/api/projects/template-thesis/stats/plots/generate",
        json={
            "file_path": BENCHMARK_CSV,
            "plot_type": "chisquare_mosaic",
            "factor": "group",
            "factor2": "gender",
        },
    )
    assert res_chi.status_code == 200
    assert res_chi.json()["plot_type"] == "chisquare_mosaic"
    assert res_chi.json()["image_data_url"].startswith("data:image/png;base64,")


def test_api_concurrent_plot_delivery_jasp():
    """Verifies single-step JASP concurrent plot delivery in analysis responses."""
    # 1. Descriptive with concurrent plot
    res_desc = client.post(
        "/api/projects/template-thesis/stats/descriptive",
        json={
            "file_path": BENCHMARK_CSV,
            "variables": ["study_hours"],
            "include_plot": True,
        },
    )
    assert res_desc.status_code == 200
    data_desc = res_desc.json()
    assert "plot" in data_desc
    assert data_desc["plot"]["plot_type"] == "distribution_qq"
    assert data_desc["plot"]["image_data_url"].startswith("data:image/png;base64,")

    # 2. T-Test Independent with concurrent plot
    res_ttest = client.post(
        "/api/projects/template-thesis/stats/ttest/independent",
        json={
            "file_path": BENCHMARK_CSV,
            "test_variable": "exam_score",
            "group_variable": "group",
            "include_plot": True,
            "plot_type": "mean_difference",
        },
    )
    assert res_ttest.status_code == 200
    data_ttest = res_ttest.json()
    assert "plot" in data_ttest
    assert data_ttest["plot"]["plot_type"] == "mean_difference_ci"
    assert data_ttest["plot"]["image_data_url"].startswith("data:image/png;base64,")

    # 3. Correlation with concurrent plot
    res_corr = client.post(
        "/api/projects/template-thesis/stats/correlation/pearson",
        json={
            "file_path": BENCHMARK_CSV,
            "variables": ["study_hours", "exam_score", "prior_gpa"],
            "include_plot": True,
        },
    )
    assert res_corr.status_code == 200
    data_corr = res_corr.json()
    assert "plot" in data_corr
    assert data_corr["plot"]["plot_type"] == "correlation_heatmap"
    assert data_corr["plot"]["image_data_url"].startswith("data:image/png;base64,")
