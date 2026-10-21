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
    run_ancova,
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
    assert "residuals_normality" in res
    assert res["residuals_normality"] is not None
    assert 0.0 <= res["residuals_normality"]["w"] <= 1.0


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
    assert "residuals_normality" in res
    assert res["residuals_normality"] is not None
    assert 0.0 <= res["residuals_normality"]["w"] <= 1.0


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


def test_jasp_benchmark_parity():
    csv_path = Path("benchmark_audit_200.csv")
    if not csv_path.exists():
        pytest.skip("benchmark_audit_200.csv not found")

    from backend.services.stats import run_descriptive_analysis

    # 1. Descriptive Parity
    desc = run_descriptive_analysis(csv_path, ["study_hours", "exam_score"])
    sh = next(d for d in desc if d["variable"] == "study_hours")
    es = next(d for d in desc if d["variable"] == "exam_score")
    assert round(sh["mean"], 2) == 32.24
    assert round(sh["std"], 3) == 5.774
    assert round(sh["iqr"], 3) == 7.525
    assert round(sh["coeff_variation"], 4) == 0.1791
    assert round(es["mean"], 2) == 83.60
    assert round(es["std"], 3) == 9.358
    assert abs(es["iqr"] - 11.625) < 1e-4  # JASP displays 11.63 (rounded from 11.625)
    assert round(es["coeff_variation"], 4) == 0.1119

    # 2. T-Test & Residuals Normality Parity
    tt_sh = run_ttest_independent(csv_path, "study_hours", "group")
    assert round(tt_sh["equal_var"]["t_statistic"], 4) == -0.9625
    assert round(tt_sh["equal_var"]["df"]) == 198
    assert round(tt_sh["equal_var"]["p_value"], 3) == 0.337
    assert round(tt_sh["residuals_normality"]["w"], 4) == 0.9952
    assert round(tt_sh["residuals_normality"]["p"], 3) == 0.783

    tt_es = run_ttest_independent(csv_path, "exam_score", "group")
    assert round(tt_es["equal_var"]["t_statistic"], 3) == -8.163
    assert round(tt_es["equal_var"]["df"]) == 198
    assert tt_es["equal_var"]["p_value"] < 0.001
    assert round(tt_es["residuals_normality"]["w"], 4) == 0.9913
    assert round(tt_es["residuals_normality"]["p"], 3) == 0.276

    # 3. ANOVA One-Way Parity
    an_sh = run_anova_oneway(csv_path, "study_hours", "group")
    assert round(an_sh["ss_between"], 2) == 30.89
    assert an_sh["df_between"] == 1
    assert round(an_sh["ms_between"], 2) == 30.89
    assert round(an_sh["f_statistic"], 4) == 0.9263
    assert round(an_sh["p_value"], 3) == 0.337
    assert round(an_sh["residuals_normality"]["w"], 4) == 0.9952
    assert round(an_sh["residuals_normality"]["p"], 3) == 0.783

    # 4. ANCOVA Parity on benchmark_audit_200.csv
    anc = run_ancova(
        csv_path,
        dependent="exam_score",
        factor="group",
        covariates=["study_hours"],
    )
    assert anc["analysis_type"] == "ancova"
    assert anc["total_n"] == 200
    eff_group = next(e for e in anc["effects"] if e["source"] == "group")
    eff_sh = next(e for e in anc["effects"] if e["source"] == "study_hours")
    assert round(eff_group["sum_sq"], 2) == 3549.20
    assert round(eff_group["f_statistic"], 2) == 177.91
    assert eff_group["p_value"] < 0.001
    assert round(eff_sh["sum_sq"], 2) == 9107.03
    assert round(eff_sh["f_statistic"], 2) == 456.50
    assert eff_sh["p_value"] < 0.001
    assert round(anc["residuals_normality"]["w"], 4) == 0.9921
    assert round(anc["residuals_normality"]["p"], 3) == 0.354


def test_ancova(parametric_csv_file):
    res = run_ancova(
        parametric_csv_file,
        dependent="score",
        factor="group2",
        covariates=["iq"],
    )
    assert res["analysis_type"] == "ancova"
    assert res["total_n"] == 8
    assert len(res["effects"]) >= 2
    assert len(res["adjusted_means"]) == 2
    assert "residuals_normality" in res
    assert "homogeneity_of_slopes" in res
