import pytest
import tempfile
from pathlib import Path
import polars as pl
from backend.services.stats_nonparametric import (
    run_mann_whitney_u,
    run_wilcoxon_signed_rank,
    run_kruskal_wallis,
    run_correlation_spearman,
    run_chisquare_independence,
)


@pytest.fixture
def nonparametric_csv_file():
    with tempfile.TemporaryDirectory() as tmpdir:
        csv_path = Path(tmpdir) / "nonparametric_test.csv"
        data = {
            "group2": [
                "GroupA",
                "GroupA",
                "GroupA",
                "GroupA",
                "GroupB",
                "GroupB",
                "GroupB",
                "GroupB",
            ],
            "group3": ["G1", "G1", "G2", "G2", "G3", "G3", "G1", "G2"],
            "pre_score": [10.0, 12.0, 15.0, 18.0, 20.0, 22.0, 25.0, 28.0],
            "post_score": [12.0, 14.0, 19.0, 20.0, 21.0, 26.0, 29.0, 31.0],
            "ordinal_x": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0],
            "ordinal_y": [1.5, 2.5, 3.2, 4.1, 5.8, 6.2, 7.1, 8.5],
            "category_dept": [
                "Engineering",
                "Engineering",
                "Marketing",
                "Marketing",
                "Sales",
                "Sales",
                "Engineering",
                "Marketing",
            ],
            "category_level": [
                "Junior",
                "Senior",
                "Junior",
                "Senior",
                "Junior",
                "Senior",
                "Junior",
                "Junior",
            ],
        }
        df = pl.DataFrame(data)
        df.write_csv(csv_path)
        yield csv_path


def test_mann_whitney_u(nonparametric_csv_file):
    res = run_mann_whitney_u(
        nonparametric_csv_file, test_variable="pre_score", group_variable="group2"
    )
    assert res["analysis_type"] == "mann_whitney_u"
    assert res["group1"]["n"] == 4
    assert res["group2"]["n"] == 4
    assert res["u_statistic"] >= 0.0
    assert 0.0 <= res["p_value"] <= 1.0


def test_wilcoxon_signed_rank(nonparametric_csv_file):
    res = run_wilcoxon_signed_rank(
        nonparametric_csv_file, var1="post_score", var2="pre_score"
    )
    assert res["analysis_type"] == "wilcoxon_signed_rank"
    assert res["n_total"] == 8
    assert res["n_effective"] == 8
    assert res["positive_pairs"] == 8
    assert 0.0 <= res["p_value"] <= 1.0


def test_kruskal_wallis(nonparametric_csv_file):
    res = run_kruskal_wallis(
        nonparametric_csv_file, test_variable="pre_score", group_variable="group3"
    )
    assert res["analysis_type"] == "kruskal_wallis"
    assert res["sample_size"] == 8
    assert res["k_groups"] == 3
    assert res["df"] == 2
    assert res["h_statistic"] >= 0.0
    assert 0.0 <= res["p_value"] <= 1.0
    assert len(res["groups"]) == 3


def test_correlation_spearman(nonparametric_csv_file):
    res = run_correlation_spearman(
        nonparametric_csv_file, variables=["ordinal_x", "ordinal_y"]
    )
    assert res["analysis_type"] == "correlation_spearman"
    assert len(res["variables"]) == 2
    assert len(res["matrix"]) == 2
    # Perfect monotonic relationship gives rho == 1.0
    assert abs(res["matrix"][0]["correlations"][1]["rho"] - 1.0) < 1e-5


def test_chisquare_independence(nonparametric_csv_file):
    res = run_chisquare_independence(
        nonparametric_csv_file,
        row_variable="category_dept",
        col_variable="category_level",
    )
    assert res["analysis_type"] == "chisquare_independence"
    assert res["sample_size"] == 8
    assert res["chi2_statistic"] >= 0.0
    assert 0.0 <= res["p_value"] <= 1.0
    assert 0.0 <= res["cramers_v"] <= 1.0
    assert len(res["crosstab"]) > 0
