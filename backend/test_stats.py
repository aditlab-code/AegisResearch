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
    audit_sample_completeness,
    sanitize_analysis_data,
    StatsError,
)
from backend.services.stats_logistic import run_logistic_regression
from backend.services.stats_plots import (
    plot_distribution_qq,
    plot_group_comparison,
    plot_regression_diagnostics,
    plot_roc_curve,
    plot_mean_difference_ci,
    plot_hypothesis_critical_region,
)
from backend.services.latex_table_gen import (
    generate_descriptive_latex_table,
    generate_reliability_latex_table,
    generate_regression_latex_table,
    generate_logistic_regression_latex_table,
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
            "binary_y": [0, 1, 0, 0, 1, 0, 1, 1, 0, 1],
            "x1": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0],
            "x2": [2.0, 3.5, 4.0, 5.5, 6.0, 7.5, 8.0, 9.5, 10.0, 11.5],
            "y": [3.1, 5.0, 6.9, 9.2, 10.8, 13.1, 14.9, 17.1, 19.2, 20.8],
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
    assert x1_res["iqr"] is not None
    assert x1_res["coeff_variation"] is not None
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
        sample_csv_file,
        dependent="y",
        independents=["x1", "x2"],
        baseline_independents=["x1"],
    )
    assert res["dependent"] == "y"
    assert res["r_squared"] > 0.9  # strongly correlated
    assert len(res["coefficients"]) == 3  # (Constant), x1, x2
    assert "collinearity_diagnostics" in res
    assert len(res["collinearity_diagnostics"]) == 3
    assert "f_change" in res
    assert res["f_change"] is not None
    assert "r2_change" in res["f_change"]

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


def test_logistic_regression_analysis(sample_csv_file):
    res = run_logistic_regression(
        sample_csv_file,
        dependent="binary_y",
        independents=["x1", "x2"],
        cutoff=0.5,
    )
    assert res["dependent"] == "binary_y"
    assert res["sample_size"] == 10
    assert "model_chi2" in res
    assert "pseudo_r2" in res
    assert "nagelkerke" in res["pseudo_r2"]
    assert len(res["coefficients"]) == 3
    assert "classification" in res
    assert "auc" in res["classification"]
    assert "roc_curve" in res
    assert len(res["roc_curve"]) > 10

    table = generate_logistic_regression_latex_table(
        res["dependent"],
        res["coefficients"],
        {
            "model_chi2": res["model_chi2"],
            "model_chi2_df": res["model_chi2_df"],
            "model_chi2_p": res["model_chi2_p"],
            "pseudo_r2": res["pseudo_r2"],
        },
        res["classification"],
    )
    assert r"\begin{table}" in table
    assert "Predicting" in table
    assert "Nagelkerke" in table


def test_manova_analysis(sample_csv_file):
    res = run_manova_analysis(sample_csv_file, dependents=["y", "y2"], factor="group")
    assert res["factor"] == "group"
    assert len(res["tests"]) >= 4
    test_names = [t["test_name"] for t in res["tests"]]
    assert any("Wilks" in t or "Pillai" in t for t in test_names)
    assert "group_descriptives" in res
    assert len(res["group_descriptives"]) > 0
    assert "box_m" in res

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


def test_missing_audit_and_descriptives_upgrade():
    with tempfile.TemporaryDirectory() as tmpdir:
        csv_path = Path(tmpdir) / "missing_data.csv"
        # 10 rows: col_a has 2 nulls, col_b has 3 nulls, col_c is complete
        data = {
            "col_a": [1.0, None, 3.0, 4.0, 5.0, 5.0, None, 8.0, 9.0, 10.0],
            "col_b": [None, 2.0, None, 4.0, 5.0, 6.0, 7.0, None, 9.0, 10.0],
            "col_c": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0],
        }
        pl.DataFrame(data).write_csv(csv_path)

        # Pairwise strategy test
        res_pairwise = run_descriptive_analysis(
            csv_path, ["col_a", "col_b", "col_c"], missing_strategy="pairwise"
        )
        assert len(res_pairwise) == 3

        a_stat = next(r for r in res_pairwise if r["variable"] == "col_a")
        assert a_stat["n_total"] == 10
        assert a_stat["n_valid"] == 8
        assert a_stat["n_missing"] == 2
        assert a_stat["missing_pct"] == 20.0
        assert a_stat["variance"] is not None and a_stat["variance"] > 0
        assert a_stat["mode"] == 5.0

        b_stat = next(r for r in res_pairwise if r["variable"] == "col_b")
        assert b_stat["n_total"] == 10
        assert b_stat["n_valid"] == 7
        assert b_stat["n_missing"] == 3
        assert b_stat["missing_pct"] == 30.0

        # Listwise strategy test (only rows complete in all 3 cols are kept)
        res_listwise = run_descriptive_analysis(
            csv_path, ["col_a", "col_b", "col_c"], missing_strategy="listwise"
        )
        # Rows with nulls in either a or b are: index 0 (b null), index 1 (a null), index 2 (b null), index 6 (a null), index 7 (b null) -> 5 rows remaining
        for r in res_listwise:
            assert r["n"] == 5


def test_diagnostic_plots(sample_csv_file):
    project_dir = sample_csv_file.parent

    # 1. Distribution & Q-Q Plot
    dist_res = plot_distribution_qq(sample_csv_file, "y", project_dir)
    assert dist_res["plot_type"] == "distribution_qq"
    assert (project_dir / dist_res["image_path"]).exists()
    assert r"\begin{figure}" in dist_res["latex_snippet"]
    assert dist_res["variable"] == "y"

    # 2. Group Comparison (Box + Jitter)
    grp_res = plot_group_comparison(sample_csv_file, "y", "group", project_dir)
    assert grp_res["plot_type"] == "group_comparison"
    assert (project_dir / grp_res["image_path"]).exists()
    assert r"\begin{figure}" in grp_res["latex_snippet"]
    assert grp_res["dependent"] == "y"
    assert grp_res["factor"] == "group"

    # 3. Regression Diagnostics (Residuals vs Fitted + Q-Q)
    reg_res = plot_regression_diagnostics(
        sample_csv_file, "y", ["x1", "x2"], project_dir
    )
    assert reg_res["plot_type"] == "regression_diagnostics"
    assert (project_dir / reg_res["image_path"]).exists()
    assert r"\begin{figure}" in reg_res["latex_snippet"]
    assert reg_res["dependent"] == "y"

    # 4. ROC Curve for Logistic Regression
    roc_res = plot_roc_curve(
        sample_csv_file, "binary_y", ["x1", "x2"], project_dir, cutoff=0.5
    )
    assert roc_res["plot_type"] == "roc_curve"
    assert (project_dir / roc_res["image_path"]).exists()
    assert r"\begin{figure}" in roc_res["latex_snippet"]
    assert 0.0 <= roc_res["auc"] <= 1.0

    # 5. Mean Difference with 95% CI
    diff_res = plot_mean_difference_ci(
        sample_csv_file, "y", "binary_y", project_dir, alternative="two-sided"
    )
    assert diff_res["plot_type"] == "mean_difference_ci"
    assert (project_dir / diff_res["image_path"]).exists()
    assert r"\begin{figure}" in diff_res["latex_snippet"]
    assert "difference" in diff_res
    assert "ci_lower" in diff_res
    assert "ci_upper" in diff_res

    # 6. Null Hypothesis Critical Region (One-Sample & Two-Sample)
    crit_1samp = plot_hypothesis_critical_region(
        sample_csv_file,
        "y",
        None,
        project_dir,
        test_value=10.0,
        alternative="two-sided",
    )
    assert crit_1samp["plot_type"] == "hypothesis_critical_region"
    assert (project_dir / crit_1samp["image_path"]).exists()
    assert r"\begin{figure}" in crit_1samp["latex_snippet"]
    assert "t_obs" in crit_1samp
    assert "p_value" in crit_1samp

    crit_2samp = plot_hypothesis_critical_region(
        sample_csv_file,
        "y",
        "binary_y",
        project_dir,
        test_value=0.0,
        alternative="greater",
    )
    assert crit_2samp["plot_type"] == "hypothesis_critical_region"
    assert (project_dir / crit_2samp["image_path"]).exists()
    assert r"\begin{figure}" in crit_2samp["latex_snippet"]
