from typing import Any

from pydantic import BaseModel


class BibliometricsOverviewRequest(BaseModel):
    file_path: str


class BibliometricsNetworkRequest(BaseModel):
    file_path: str
    network_type: str = "keywords"
    min_frequency: int = 3
    top_n: int = 50
    exclude_keywords: list[str] | None = None
    method: str = "equivalence"


class BibliometricsThematicMapRequest(BaseModel):
    file_path: str
    network_type: str = "keywords"
    min_frequency: int = 3
    top_n: int = 60
    exclude_keywords: list[str] | None = None


class BibliometricsThematicEvolutionRequest(BaseModel):
    file_path: str
    slice_count: int = 3
    min_frequency: int = 2
    exclude_keywords: list[str] | None = None


class BibliometricsLawsRequest(BaseModel):
    file_path: str


class BibliometricsExportTikzRequest(BaseModel):
    graph_type: str
    data: dict[str, Any]
