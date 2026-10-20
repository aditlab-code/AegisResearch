import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_search_min_5_chars_validation():
    # Less than 5 characters should return 400
    res = client.get("/api/projects/template-thesis/search?q=kata")
    assert res.status_code == 400
    assert "minimal harus 5 karakter" in res.json()["detail"].lower()


def test_search_valid_keyword():
    # 5 or more characters
    res = client.get("/api/projects/template-thesis/search?q=Modular")
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "Modular"
    assert data["totalMatches"] > 0
    assert data["fileCount"] > 0
    # Make sure matches contain line numbers
    first_file = data["results"][0]
    assert len(first_file["matches"]) > 0
    assert first_file["matches"][0]["lineNumber"] > 0
    assert "modular" in first_file["matches"][0]["lineText"].lower()


def test_search_case_sensitivity():
    res_ci = client.get(
        "/api/projects/template-thesis/search?q=modular&case_sensitive=false"
    )
    assert res_ci.status_code == 200
    count_ci = res_ci.json()["totalMatches"]

    res_cs = client.get(
        "/api/projects/template-thesis/search?q=Modular&case_sensitive=true"
    )
    assert res_cs.status_code == 200
    count_cs = res_cs.json()["totalMatches"]

    assert count_ci >= count_cs
