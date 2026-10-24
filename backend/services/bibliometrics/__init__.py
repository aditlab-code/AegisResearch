"""Native Bibliometric Engine for Aegis Research.

Provides fast, zero-R-dependency bibliometric and scientometric analysis
supporting standard Scopus and Web of Science BibTeX exports:
1. Overview Corpus Statistics (bibtex_parser)
2. Keyword Co-Occurrence & Co-Authorship Networks (network_engine)
3. Thematic Map & Thematic Evolution (thematic_engine)
4. Bibliometric Laws (scientometric_laws)
5. Publication-ready LaTeX TikZ / PGFPlots Export (tikz_export)
"""

from .bibtex_parser import (
    DEFAULT_ACADEMIC_STOPWORDS,
    DEFAULT_SLR_STOPWORDS,
    BibliometricError,
    clean_keyword,
    get_bibliometric_overview,
    parse_bibtex_corpus,
)
from .network_engine import (
    _greedy_modularity_clustering,
    compute_cooccurrence_network,
)
from .scientometric_laws import compute_bibliometric_laws
from .thematic_engine import (
    compute_thematic_evolution,
    compute_thematic_map,
)
from .tikz_export import generate_bibliometric_tikz

__all__ = [
    "DEFAULT_ACADEMIC_STOPWORDS",
    "DEFAULT_SLR_STOPWORDS",
    "BibliometricError",
    "_greedy_modularity_clustering",
    "clean_keyword",
    "compute_bibliometric_laws",
    "compute_cooccurrence_network",
    "compute_thematic_evolution",
    "compute_thematic_map",
    "generate_bibliometric_tikz",
    "get_bibliometric_overview",
    "parse_bibtex_corpus",
]
