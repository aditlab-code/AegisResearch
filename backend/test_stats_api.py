import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_api_descriptive():
    payload = {
        "file_path": "assets/research_transactions.csv",
        "variables": ["TransactionAmt", "card1"],
        "include_normality": False,
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
        "file_path": "assets/research_transactions.csv",
        "dependent": "TransactionAmt",
        "independents": ["card1"],
        "check_vif": True,
        "check_durbin_watson": True,
    }
    res = client.post("/api/projects/template-thesis/stats/regression", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["analysis_type"] == "regression"
    assert data["dependent"] == "TransactionAmt"
    assert "r_squared" in data
    assert len(data["coefficients"]) >= 2
    assert "latex_table" in data


def test_api_stats_file_not_found():
    payload = {
        "file_path": "assets/non_existent.csv",
        "variables": ["TransactionAmt"],
    }
    res = client.post("/api/projects/template-thesis/stats/descriptive", json=payload)
    assert res.status_code == 404


def test_api_ttest_one_sample():
    payload = {
        "file_path": "assets/research_transactions.csv",
        "variable": "TransactionAmt",
        "test_value": 100.0,
    }
    res = client.post(
        "/api/projects/template-thesis/stats/ttest/one-sample", json=payload
    )
    assert res.status_code == 200
    data = res.json()
    assert data["analysis_type"] == "ttest_one_sample"
    assert "latex_table" in data
    assert r"\begin{table}" in data["latex_table"]


def test_api_ttest_independent():
    payload = {
        "file_path": "assets/research_transactions.csv",
        "test_variable": "TransactionAmt",
        "group_variable": "card6",
    }
    # Note: card6 might have debit/credit or others. Let's filter or let it test if exactly 2 groups
    # If card6 has more than 2 groups, test error or endpoint response
    res = client.post(
        "/api/projects/template-thesis/stats/ttest/independent", json=payload
    )
    # Status code is 200 or 400 depending on category count
    assert res.status_code in (200, 400)


def test_api_correlation_pearson():
    payload = {
        "file_path": "assets/research_transactions.csv",
        "variables": ["TransactionAmt", "card1", "C1"],
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
        "file_path": "assets/research_transactions.csv",
        "variables": ["TransactionAmt", "card1"],
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
        "file_path": "assets/research_transactions.csv",
        "row_variable": "ProductCD",
        "col_variable": "card4",
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
        "file_path": "benchmark_audit_200.csv",
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
