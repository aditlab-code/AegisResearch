import pytest
import tempfile
from pathlib import Path
import polars as pl
from backend.services.stats import (
    run_descriptive_analysis,
    run_reliability_analysis,
    run_regression_analysis,
    run_manova_analysis,
    run_pca_analysis,
    StatsError,
)
from backend.services.latex_table_gen import (
    generate_descriptive_latex_table,
    generate_reliability_latex_table,
    generate_regression_latex_table,
    generate_manova_latex_table,
    generate_pca_latex_table,
)


@pytest.fixture
def sample_csv_file():
    with tempfile.TemporaryDirectory() as tmpdir:
        csv_path = Path(tmpdir) / "test_data.csv"
        # Create synthetic dataset with known relationships
        # X1, X2 predicting Y, and Likert scale items Q1..Q4
        data = {
            "group": ["A", "A", "A", "B", "B", "B", "C", "C", "C", "A"],
            "x1": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0],
            "x2": [2.0, 3.5, 4.0, 5.5, 6.0, 7.5, 8.0, 9.5, 10.0, 11.5],
            "y": [3.0, 5.0, 7.0, 9.0, 11.0, 13.0, 15.0, 17.0, 19.0, 21.0],
            "y2": [10.0, 9.0, 8.0, 7.0, 6.0, 5.0, 4.0, 3.0, 2.0, 1.0],
            "q1": [4.0, 5.0, 4.0, 3.0, 5.0, 4.0, 3.0, 4.0, 5.0, 4.0],
            "q2": [4.0, 5.0, 4.0, 4.0, 5.0, 3.0, 3.0, 4.0, 5.0, 4.0],
            "q3": [3.0, 4.0, 4.0, 3.0, 4.0, 4.0, 2.0, 3.0, 4.0, 3.0],
            "q4": [4.0, 5.0, 3.0, 3.0, 5.0, 4.0, 3.0, 4.0, 4.0, 4.0],
        }
        df = pl.DataFrame(data)
        df.write_csv(csv_path)
        yield csv_path


def test_descriptive_analysis(sample_csv_file):
    res = run_descriptive_analysis(sample_csv_file, ["x1", "y"])
    assert len(res) == 2
    x1_res = next(r for r in res if r["variable"] == "x1")
    assert x1_res["n"] == 10
    assert x1_res["mean"] == 5.5
    assert x1_res["min"] == 1.0
    assert x1_res["max"] == 10.0
    assert x1_res["shapiro_w"] is not None

    table = generate_descriptive_latex_table(res)
    assert r"\begin{table}" in table
    assert r"Variable & $N$ & $M$ & $SD$" in table
    assert "x1 & 10" in table


def test_reliability_analysis(sample_csv_file):
    res = run_reliability_analysis(sample_csv_file, ["q1", "q2", "q3", "q4"])
    assert res["items_count"] == 4
    assert res["sample_size"] == 10
    assert 0.0 <= res["cronbach_alpha"] <= 1.0
    assert len(res["item_stats"]) == 4

    table = generate_reliability_latex_table(
        res["cronbach_alpha"], res["items_count"], res["sample_size"], res["item_stats"]
    )
    assert r"\begin{table}" in table
    assert r"Corrected $r_{it}$" in table
    assert "q1" in table


def test_regression_analysis(sample_csv_file):
    res = run_regression_analysis(
        sample_csv_file, dependent="y", independents=["x1", "x2"]
    )
    assert res["dependent"] == "y"
    assert res["r_squared"] > 0.9  # strongly correlated
    assert len(res["coefficients"]) == 3  # (Constant), x1, x2

    table = generate_regression_latex_table(
        res["dependent"],
        res["r"],
        res["r_squared"],
        res["adj_r_squared"],
        res["f_statistic"],
        res["f_p_value"],
        res["coefficients"],
    )
    assert r"\begin{table}" in table
    assert "Predicting y" in table
    assert r"Predictor & $B$ & $SE_B$ & $\beta$" in table


def test_manova_analysis(sample_csv_file):
    res = run_manova_analysis(sample_csv_file, dependents=["y", "y2"], factor="group")
    assert res["factor"] == "group"
    assert len(res["tests"]) >= 4
    test_names = [t["test_name"] for t in res["tests"]]
    assert any("Wilks" in t or "Pillai" in t for t in test_names)

    table = generate_manova_latex_table(res["factor"], res["dependents"], res["tests"])
    assert r"\begin{table}" in table
    assert "MANOVA" in table


def test_pca_analysis(sample_csv_file):
    res = run_pca_analysis(
        sample_csv_file, variables=["x1", "x2", "y", "y2"], n_components=2
    )
    assert res["n_components"] == 2
    assert len(res["explained_variance_ratio"]) == 2
    assert len(res["eigenvalues"]) == 2
    assert len(res["loadings"]) == 4

    table = generate_pca_latex_table(
        res["loadings"], res["explained_variance_ratio"], res["eigenvalues"]
    )
    assert r"\begin{table}" in table
    assert "PC1 & PC2" in table


def test_multi_style_latex_tables(sample_csv_file):
    from backend.services.latex_table_gen import (
        generate_multi_style_table,
    )

    res = run_descriptive_analysis(sample_csv_file, ["x1", "y"])
    tables = generate_multi_style_table(generate_descriptive_latex_table, res)

    # APA verification
    assert r"$N$ & $M$ & $SD$" in tables["apa"]
    assert r"\toprule" in tables["apa"]

    # IEEE verification
    assert r"\textsc{Descriptive Statistics}" in tables["ieee"]
    assert r"Sample Size & Mean & Std. Dev." in tables["ieee"]

    # Classic verification
    assert r"\hline" in tables["classic"]
    assert "|l|r|r|r|r|r|r|r|" in tables["classic"]
