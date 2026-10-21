import pytest
from pathlib import Path
from backend.services.bibliometrics import (
    parse_bibtex_corpus,
    get_bibliometric_overview,
    compute_cooccurrence_network,
    compute_thematic_map,
    compute_thematic_evolution,
    compute_bibliometric_laws,
    generate_bibliometric_tikz,
    clean_keyword,
    BibliometricError,
)

XAI_BIB_PATH = Path("backend/latex_workspaces/template-thesis/references.bib")


def test_clean_keyword():
    assert clean_keyword("  Deep-Learning  ") == "deep learning"
    assert clean_keyword("Neural Networks") == "neural network"
    assert clean_keyword("Analysis") == "analysis"  # preserved non-plural s


def test_parse_bibtex_corpus():
    entries = parse_bibtex_corpus(XAI_BIB_PATH)
    assert len(entries) >= 400
    first = entries[0]
    assert "id" in first
    assert "author_list" in first
    assert "extracted_keywords" in first
    assert first["year"] is not None


def test_get_bibliometric_overview():
    ov = get_bibliometric_overview(XAI_BIB_PATH)
    assert ov["total_documents"] >= 400
    assert ov["unique_authors"] > 1000
    assert ov["unique_sources"] > 100
    assert ov["total_citations"] >= 0
    assert ov["avg_citations_per_doc"] >= 0.0


def test_compute_cooccurrence_network():
    net = compute_cooccurrence_network(
        XAI_BIB_PATH,
        network_type="keywords",
        min_frequency=5,
        top_n=30,
        exclude_keywords=["crime"],
    )
    assert net["total_nodes"] <= 30
    assert net["total_edges"] > 0
    assert net["cluster_count"] >= 1
    # Check that excluded keyword is not in nodes
    node_ids = [n["id"] for n in net["nodes"]]
    assert "crime" not in node_ids


def test_compute_thematic_map():
    tm = compute_thematic_map(XAI_BIB_PATH, min_frequency=5, top_n=35)
    assert len(tm["clusters"]) >= 1
    for c in tm["clusters"]:
        assert c["quadrant"] in [
            "Motor Themes",
            "Niche Themes",
            "Emerging or Declining",
            "Basic & Transversal",
        ]
        assert "centrality" in c
        assert "density" in c


def test_compute_thematic_evolution():
    te = compute_thematic_evolution(XAI_BIB_PATH, min_frequency=3)
    assert len(te["time_slices"]) >= 2
    assert len(te["nodes"]) > 0


def test_compute_bibliometric_laws():
    laws = compute_bibliometric_laws(XAI_BIB_PATH)
    b = laws["bradford"]
    assert b["total_sources"] > 50
    assert b["zone1"]["article_count"] > 0
    assert b["bradford_multiplier"] > 0

    l = laws["lotka"]
    assert l["total_authors"] > 500
    assert l["n_exponent"] > 1.0
    assert l["ks_statistic"] < 0.2


def test_generate_bibliometric_tikz():
    tm = compute_thematic_map(XAI_BIB_PATH, min_frequency=5, top_n=20)
    tikz = generate_bibliometric_tikz("thematic_map", tm)
    assert r"\begin{tikzpicture}" in tikz
    assert r"\begin{axis}" in tikz
    assert r"\end{tikzpicture}" in tikz

    laws = compute_bibliometric_laws(XAI_BIB_PATH)
    b_tikz = generate_bibliometric_tikz("bradford", laws)
    assert r"\begin{tikzpicture}" in b_tikz
