"""BibTeX corpus parsing and statistical overview for bibliometric analysis."""

import re
from pathlib import Path
from typing import Any


class BibliometricError(Exception):
    """Raised when parsing or bibliometric computation fails."""


# Default generic academic stopwords to prevent thematic noise
DEFAULT_ACADEMIC_STOPWORDS: set[str] = {
    "article",
    "articles",
    "conference",
    "conferences",
    "proceedings",
    "paper",
    "papers",
    "review",
    "reviews",
    "survey",
    "surveys",
    "study",
    "studies",
    "comparative study",
    "comparative studies",
    "human",
    "humans",
    "methodology",
    "methodologies",
    "research",
    "analysis",
    "analyses",
    "evaluation",
    "evaluations",
    "system",
    "systems",
    "model",
    "models",
    "approach",
    "approaches",
    "framework",
    "frameworks",
}

# Alias for SLR stopwords compatibility
DEFAULT_SLR_STOPWORDS: set[str] = DEFAULT_ACADEMIC_STOPWORDS


def clean_keyword(raw_kw: str) -> str:
    """Normalizes keyword: trims, lowercases, unifies hyphens, and removes common plural s."""
    k = raw_kw.strip().lower()
    # Unify separators & extra whitespace
    k = re.sub(r"[\t\r\n]+", " ", k)
    k = re.sub(r"\s+", " ", k)
    k = k.replace("-", " ")

    # Basic singularization for trailing 's' (avoiding 'analysis', 'process', 'status', 'cross')
    if len(k) > 4 and k.endswith("s") and not k.endswith(("ss", "is", "us", "cs")):
        k = k[:-1]

    return k.strip()


def parse_bibtex_corpus(file_path: Path) -> list[dict[str, Any]]:
    """Fast streaming parser for BibTeX files exported from Scopus / Web of Science."""
    if not file_path.exists() or not file_path.is_file():
        raise FileNotFoundError(f"BibTeX file not found: {file_path.name}")

    try:
        content = file_path.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        raise BibliometricError(f"Failed to read BibTeX file: {e}") from e

    entries: list[dict[str, Any]] = []

    # Match @TYPE{entry_id, ... }
    entry_pattern = re.compile(
        r"@([a-zA-Z]+)\s*\{\s*([^,\s]+)\s*,\s*(.*?)(?=\n@[a-zA-Z]+\s*\{|\Z)",
        re.DOTALL,
    )

    # Match key = {value} or key = "value" or key = 123
    field_pattern = re.compile(
        r'([a-zA-Z0-9_\-]+)\s*=\s*(?:\{((?:[^{}]|\{[^{}]*\})*)\}|"([^"]*)"|([0-9]+))',
        re.DOTALL,
    )

    for match in entry_pattern.finditer(content):
        entry_type = match.group(1).upper()
        entry_id = match.group(2).strip()
        body = match.group(3)

        fields: dict[str, Any] = {
            "id": entry_id,
            "type": entry_type,
            "title": "",
            "year": None,
            "author": "",
            "journal": "",
            "author_keywords": "",
            "keywords": "",
            "affiliations": "",
            "abstract": "",
            "doi": "",
            "cited_by": 0,
        }

        for fmatch in field_pattern.finditer(body):
            key = fmatch.group(1).lower().strip()
            # Capture from braces, quotes, or bare numbers
            val = (fmatch.group(2) or fmatch.group(3) or fmatch.group(4) or "").strip()

            if key in fields:
                if key == "year":
                    y_match = re.search(r"\d{4}", val)
                    fields["year"] = int(y_match.group(0)) if y_match else None
                else:
                    fields[key] = val
            elif key == "note" and "cited by" in val.lower():
                c_match = re.search(r"cited\s*by:\s*(\d+)", val, re.IGNORECASE)
                if c_match:
                    fields["cited_by"] = int(c_match.group(1))

        # Parse author list
        raw_authors = fields["author"]
        if raw_authors:
            # Authors in BibTeX are separated by ' and '
            authors_list = [
                a.strip() for a in re.split(r"\s+and\s+", raw_authors) if a.strip()
            ]
        else:
            authors_list = []
        fields["author_list"] = authors_list

        # Parse & clean keywords (both author_keywords and index keywords)
        kw_set: set[str] = set()
        for kw_field in ["author_keywords", "keywords"]:
            raw_kws = fields.get(kw_field, "")
            if raw_kws:
                for item in re.split(r"[;,]\s*", raw_kws):
                    cleaned = clean_keyword(item)
                    if cleaned and len(cleaned) > 2:
                        kw_set.add(cleaned)
        fields["extracted_keywords"] = sorted(kw_set)

        # Normalise journal / source
        if not fields["journal"]:
            # Check if booktitle or abbrev_source_title exists
            b_match = re.search(r"booktitle\s*=\s*\{([^}]+)\}", body, re.IGNORECASE)
            if b_match:
                fields["journal"] = b_match.group(1).strip()

        entries.append(fields)

    if not entries:
        raise BibliometricError("No valid BibTeX entries found in file")

    return entries


def get_bibliometric_overview(file_path: Path) -> dict[str, Any]:
    """Generates high-level corpus summary statistics."""
    entries = parse_bibtex_corpus(file_path)

    total_docs = len(entries)
    years = [e["year"] for e in entries if e["year"] is not None]
    timespan = f"{min(years)} - {max(years)}" if years else "N/A"

    all_authors = set()
    total_author_occurrences = 0
    all_journals = set()
    all_keywords = set()
    total_citations = 0

    for e in entries:
        for a in e["author_list"]:
            all_authors.add(a)
            total_author_occurrences += 1
        if e["journal"]:
            all_journals.add(e["journal"].strip())
        for k in e["extracted_keywords"]:
            all_keywords.add(k)
        total_citations += e.get("cited_by", 0)

    avg_citations = round(total_citations / total_docs, 2) if total_docs > 0 else 0.0
    authors_per_doc = (
        round(total_author_occurrences / total_docs, 2) if total_docs > 0 else 0.0
    )

    return {
        "total_documents": total_docs,
        "timespan": timespan,
        "unique_authors": len(all_authors),
        "unique_sources": len(all_journals),
        "unique_keywords": len(all_keywords),
        "total_citations": total_citations,
        "avg_citations_per_doc": avg_citations,
        "authors_per_doc": authors_per_doc,
    }
