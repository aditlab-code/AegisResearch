import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)
WORKSPACE = "template-thesis"
BIB_PATH = "references.bib"


def test_api_bibliometrics_overview():
    res = client.post(
        f"/api/projects/{WORKSPACE}/bibliometrics/overview",
        json={"file_path": BIB_PATH},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_documents"] >= 400
    assert data["unique_authors"] > 500


def test_api_bibliometrics_network():
    res = client.post(
        f"/api/projects/{WORKSPACE}/bibliometrics/network",
        json={
            "file_path": BIB_PATH,
            "network_type": "keywords",
            "min_frequency": 5,
            "top_n": 30,
            "exclude_keywords": ["crime"],
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_nodes"] <= 30
    assert data["total_edges"] > 0
    assert "crime" not in [n["id"] for n in data["nodes"]]


def test_api_bibliometrics_thematic_map():
    res = client.post(
        f"/api/projects/{WORKSPACE}/bibliometrics/thematic-map",
        json={"file_path": BIB_PATH, "min_frequency": 5, "top_n": 35},
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["clusters"]) > 0
    assert "tikz_code" in data
    assert r"\begin{tikzpicture}" in data["tikz_code"]


def test_api_bibliometrics_thematic_evolution():
    res = client.post(
        f"/api/projects/{WORKSPACE}/bibliometrics/thematic-evolution",
        json={"file_path": BIB_PATH, "min_frequency": 3},
    )
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "links" in data


def test_api_bibliometrics_laws():
    res = client.post(
        f"/api/projects/{WORKSPACE}/bibliometrics/laws",
        json={"file_path": BIB_PATH},
    )
    assert res.status_code == 200
    data = res.json()
    assert "bradford" in data
    assert "lotka" in data
    assert "bradford_tikz" in data
