import pytest
import tempfile
from pathlib import Path
import polars as pl
from backend.services.stats_parametric import (
    run_ttest_one_sample,
    run_ttest_independent,
    run_ttest_paired,
    run_anova_oneway,
    run_anova_twoway,
    run_correlation_pearson,
)


@pytest.fixture
def parametric_csv_file():
    with tempfile.TemporaryDirectory() as tmpdir:
        csv_path = Path(tmpdir) / "parametric_test.csv"
        data = {
            "group2": [
                "Control",
                "Control",
                "Control",
                "Control",
                "Treatment",
                "Treatment",
                "Treatment",
                "Treatment",
            ],
            "factor_a": ["A1", "A1", "A2", "A2", "A1", "A1", "A2", "A2"],
            "factor_b": ["B1", "B2", "B1", "B2", "B1", "B2", "B1", "B2"],
            "group3": ["G1", "G1", "G2", "G2", "G3", "G3", "G1", "G2"],
            "pre_score": [50.0, 55.0, 60.0, 65.0, 70.0, 75.0, 80.0, 85.0],
            "post_score": [58.0, 62.0, 67.0, 71.0, 79.0, 84.0, 88.0, 93.0],
            "score": [12.0, 15.0, 14.0, 16.0, 22.0, 24.0, 21.0, 25.0],
            "iq": [100.0, 105.0, 110.0, 115.0, 120.0, 125.0, 130.0, 135.0],
        }
        df = pl.DataFrame(data)
        df.write_csv(csv_path)
        yield csv_path


def test_one_sample_ttest(parametric_csv_file):
    res = run_ttest_one_sample(
        parametric_csv_file, variable="pre_score", test_value=60.0
    )
    assert res["n"] == 8
    assert res["mean"] == 67.5
    assert res["mean_diff"] == 7.5
    assert res["p_value"] < 0.2


def test_independent_ttest(parametric_csv_file):
    res = run_ttest_independent(
        parametric_csv_file, test_variable="score", group_variable="group2"
    )
    assert res["group1"]["n"] == 4
    assert res["group2"]["n"] == 4
    assert res["levene_f"] >= 0.0
    assert "equal_var" in res
    assert "welch_var" in res
    assert res["equal_var"]["p_value"] < 0.01  # Treatment strongly differs from Control


def test_paired_ttest(parametric_csv_file):
    res = run_ttest_paired(parametric_csv_file, var1="post_score", var2="pre_score")
    assert res["n"] == 8
    assert res["mean_diff"] > 0
    assert res["correlation"] > 0.95
    assert res["p_value"] < 0.001


def test_anova_oneway(parametric_csv_file):
    res = run_anova_oneway(
        parametric_csv_file, dependent="score", factor="group3", post_hoc=True
    )
    assert res["total_n"] == 8
    assert res["k_groups"] == 3
    assert res["ss_between"] > 0
    assert res["f_statistic"] > 0
    assert len(res["groups"]) == 3


def test_anova_twoway(parametric_csv_file):
    res = run_anova_twoway(
        parametric_csv_file, dependent="score", factor1="factor_a", factor2="factor_b"
    )
    assert res["sample_size"] == 8
    assert len(res["effects"]) >= 3


def test_correlation_pearson(parametric_csv_file):
    res = run_correlation_pearson(
        parametric_csv_file, variables=["pre_score", "post_score", "iq"]
    )
    assert len(res["variables"]) == 3
    assert len(res["matrix"]) == 3
    # Check diagonal
    assert res["matrix"][0]["correlations"][0]["r"] == 1.0
