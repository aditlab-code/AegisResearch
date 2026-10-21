"""Native Bibliometric Engine for Aegis Research.

Provides fast, zero-R-dependency bibliometric and scientometric analysis
supporting standard Scopus and Web of Science BibTeX exports:
1. Overview Corpus Statistics
2. Keyword Co-Occurrence & Co-Authorship Networks (with Modularity Clustering)
3. Thematic Map (Callon's Centrality & Density 2x2 Matrix)
4. Thematic Evolution (Temporal Time-Slices & Inclusion Index Sankey Flows)
5. Bibliometric Laws (Bradford's Law of Scattering & Lotka's Law of Author Productivity)
6. Publication-ready LaTeX TikZ / PGFPlots Export
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
import collections
import math
import re


class BibliometricError(Exception):
    """Raised when parsing or bibliometric computation fails."""

    pass


# Default generic academic stopwords to prevent thematic noise
DEFAULT_ACADEMIC_STOPWORDS: Set[str] = {
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


def parse_bibtex_corpus(file_path: Path) -> List[Dict[str, Any]]:
    """Fast streaming parser for BibTeX files exported from Scopus / Web of Science."""
    if not file_path.exists() or not file_path.is_file():
        raise FileNotFoundError(f"BibTeX file not found: {file_path.name}")

    try:
        content = file_path.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        raise BibliometricError(f"Failed to read BibTeX file: {e}") from e

    entries: List[Dict[str, Any]] = []

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

        fields: Dict[str, Any] = {
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
                    try:
                        fields["year"] = int(re.search(r"\d{4}", val).group(0))
                    except Exception:
                        fields["year"] = None
                else:
                    fields[key] = val
            elif key == "note" and "cited by" in val.lower():
                try:
                    c_match = re.search(r"cited\s*by:\s*(\d+)", val, re.IGNORECASE)
                    if c_match:
                        fields["cited_by"] = int(c_match.group(1))
                except Exception:
                    pass

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
        kw_set: Set[str] = set()
        for kw_field in ["author_keywords", "keywords"]:
            raw_kws = fields.get(kw_field, "")
            if raw_kws:
                for item in re.split(r"[;,]\s*", raw_kws):
                    cleaned = clean_keyword(item)
                    if cleaned and len(cleaned) > 2:
                        kw_set.add(cleaned)
        fields["extracted_keywords"] = sorted(list(kw_set))

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


def get_bibliometric_overview(file_path: Path) -> Dict[str, Any]:
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


def _greedy_modularity_clustering(
    nodes: List[str], links: List[Tuple[str, str, float]]
) -> Dict[str, int]:
    """Lightweight Newman-Girvan modularity community detection with degree resolution penalty."""
    adj: Dict[str, Dict[str, float]] = collections.defaultdict(dict)
    node_degree: Dict[str, float] = collections.defaultdict(float)
    total_w = 0.0

    for u, v, w in links:
        if w <= 0:
            continue
        adj[u][v] = w
        adj[v][u] = w
        node_degree[u] += w
        node_degree[v] += w
        total_w += 2.0 * w

    if total_w <= 0 or not nodes:
        return {n: 0 for n in nodes}

    two_m = total_w

    # Each node starts in its own community
    community: Dict[str, int] = {n: i for i, n in enumerate(nodes)}
    comm_tot: Dict[int, float] = {i: node_degree[n] for i, n in enumerate(nodes)}

    improved = True
    passes = 0
    while improved and passes < 15:
        improved = False
        passes += 1
        for u in nodes:
            cur_c = community[u]
            k_u = node_degree[u]

            # Remove u from current community
            comm_tot[cur_c] -= k_u

            # Calculate total link weights from u to neighbor communities
            comm_links: Dict[int, float] = collections.defaultdict(float)
            for v, w in adj[u].items():
                comm_links[community[v]] += w

            best_c = cur_c
            best_gain = 0.0

            for c, k_in in comm_links.items():
                # Newman-Girvan modularity change: Delta Q = (k_{i, in} / 2m) - (Sigma_{tot, c} * k_i / (2m)^2)
                gain = (k_in / two_m) - (comm_tot[c] * k_u) / (two_m * two_m)
                if gain > best_gain:
                    best_gain = gain
                    best_c = c

            community[u] = best_c
            comm_tot[best_c] += k_u
            if best_c != cur_c:
                improved = True

    # Re-index communities contiguously 0, 1, 2...
    unique_comms = sorted(list(set(community.values())))
    comm_map = {old: new for new, old in enumerate(unique_comms)}
    return {n: comm_map[c] for n, c in community.items()}


def compute_cooccurrence_network(
    file_path: Path,
    network_type: str = "keywords",
    min_frequency: int = 3,
    top_n: int = 50,
    exclude_keywords: Optional[List[str]] = None,
    method: str = "equivalence",
) -> Dict[str, Any]:
    """Computes co-occurrence network with Louvain community detection and association normalization."""
    entries = parse_bibtex_corpus(file_path)

    stopwords = set(DEFAULT_ACADEMIC_STOPWORDS)
    if exclude_keywords:
        stopwords.update([clean_keyword(k) for k in exclude_keywords])

    # Count item occurrences
    item_counts: collections.Counter = collections.Counter()
    doc_items: List[List[str]] = []

    for e in entries:
        if network_type == "authors":
            items = list(set(e["author_list"]))
        else:
            items = [
                k for k in e["extracted_keywords"] if k not in stopwords and len(k) > 2
            ]
        doc_items.append(items)
        for it in items:
            item_counts[it] += 1

    # Filter items by min_frequency & top_n
    valid_items = [it for it, c in item_counts.most_common(top_n) if c >= min_frequency]
    if len(valid_items) < 2:
        raise BibliometricError(
            f"Not enough items meeting frequency threshold ({min_frequency})"
        )

    valid_set = set(valid_items)

    # Co-occurrence counts
    pair_counts: collections.Counter = collections.Counter()
    for items in doc_items:
        present = sorted([it for it in set(items) if it in valid_set])
        for i in range(len(present)):
            for j in range(i + 1, len(present)):
                pair_counts[(present[i], present[j])] += 1

    # Build links with Association Strength (Equivalence index or Salton's Cosine)
    raw_links: List[Tuple[str, str, float]] = []
    edges = []
    for (u, v), c_uv in pair_counts.items():
        c_u = item_counts[u]
        c_v = item_counts[v]
        if method == "salton":
            weight = c_uv / math.sqrt(c_u * c_v)
        else:
            # Equivalence Index: C_ij^2 / (C_i * C_j)
            weight = (c_uv**2) / (c_u * c_v)

        raw_links.append((u, v, weight))
        edges.append(
            {
                "source": u,
                "target": v,
                "cooccurrences": c_uv,
                "weight": round(float(weight), 4),
            }
        )

    # Community clustering
    communities = _greedy_modularity_clustering(valid_items, raw_links)

    # Assign cluster labels based on most frequent word in cluster
    cluster_members: Dict[int, List[str]] = collections.defaultdict(list)
    for it, comm_id in communities.items():
        cluster_members[comm_id].append(it)

    cluster_labels = {}
    for c_id, members in cluster_members.items():
        top_member = max(members, key=lambda x: item_counts[x])
        cluster_labels[c_id] = top_member

    nodes = []
    for it in valid_items:
        comm_id = communities.get(it, 0)
        nodes.append(
            {
                "id": it,
                "label": it.title() if network_type == "keywords" else it,
                "frequency": item_counts[it],
                "cluster": comm_id,
                "cluster_label": cluster_labels.get(comm_id, f"Cluster {comm_id + 1}"),
            }
        )

    return {
        "network_type": network_type,
        "nodes": nodes,
        "edges": edges,
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "cluster_count": len(cluster_members),
    }


def compute_thematic_map(
    file_path: Path,
    network_type: str = "keywords",
    min_frequency: int = 3,
    top_n: int = 60,
    exclude_keywords: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Calculates Thematic Map (Callon's Centrality & Density 2x2 Strategic Diagram)."""
    net = compute_cooccurrence_network(
        file_path,
        network_type=network_type,
        min_frequency=min_frequency,
        top_n=top_n,
        exclude_keywords=exclude_keywords,
    )

    nodes = {n["id"]: n for n in net["nodes"]}
    cluster_members: Dict[int, List[str]] = collections.defaultdict(list)
    for n in net["nodes"]:
        cluster_members[n["cluster"]].append(n["id"])

    # Build adjacency
    edge_weights: Dict[Tuple[str, str], float] = {}
    for e in net["edges"]:
        u, v, w = e["source"], e["target"], e["weight"]
        edge_weights[(u, v)] = w
        edge_weights[(v, u)] = w

    clusters_result = []
    centralities = []
    densities = []

    for c_id, members in cluster_members.items():
        w_cluster = len(members)
        if w_cluster < 1:
            continue

        # Density: internal link strength / cluster size
        internal_sum = 0.0
        for i in range(len(members)):
            for j in range(i + 1, len(members)):
                internal_sum += edge_weights.get((members[i], members[j]), 0.0)

        density = (100.0 * internal_sum / w_cluster) if w_cluster > 0 else 0.0

        # Centrality: external link strength with other clusters
        external_sum = 0.0
        for m in members:
            for other_id, other_node in nodes.items():
                if other_node["cluster"] != c_id:
                    external_sum += edge_weights.get((m, other_id), 0.0)

        centrality = 10.0 * external_sum

        total_freq = sum(nodes[m]["frequency"] for m in members)
        top_words = sorted(members, key=lambda x: nodes[x]["frequency"], reverse=True)[
            :5
        ]
        theme_name = ", ".join([w.title() for w in top_words[:3]])

        clusters_result.append(
            {
                "cluster_id": c_id,
                "name": theme_name,
                "keywords": top_words,
                "size": total_freq,
                "centrality": round(centrality, 3),
                "density": round(density, 3),
            }
        )
        centralities.append(centrality)
        densities.append(density)

    # Calculate median threshold for 2x2 split
    med_c = float(sorted(centralities)[len(centralities) // 2]) if centralities else 0.0
    med_d = float(sorted(densities)[len(densities) // 2]) if densities else 0.0

    # Categorize quadrants
    for c in clusters_result:
        is_high_c = c["centrality"] >= med_c
        is_high_d = c["density"] >= med_d
        if is_high_c and is_high_d:
            quad = "Motor Themes"
        elif not is_high_c and is_high_d:
            quad = "Niche Themes"
        elif not is_high_c and not is_high_d:
            quad = "Emerging or Declining"
        else:
            quad = "Basic & Transversal"
        c["quadrant"] = quad

    return {
        "clusters": clusters_result,
        "median_centrality": round(med_c, 3),
        "median_density": round(med_d, 3),
    }


def compute_thematic_evolution(
    file_path: Path,
    time_slices: Optional[List[Tuple[int, int]]] = None,
    slice_count: int = 3,
    min_frequency: int = 2,
    exclude_keywords: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Computes Thematic Evolution across publication year slices using the Inclusion Index."""
    entries = parse_bibtex_corpus(file_path)
    years = [e["year"] for e in entries if e["year"] is not None]
    if not years:
        raise BibliometricError(
            "No valid publication years found for thematic evolution"
        )

    min_y, max_y = min(years), max(years)
    unique_years = sorted(list(set(years)))

    # Dynamic time slice generation based on slice_count if not provided
    if not time_slices:
        if len(unique_years) <= slice_count:
            time_slices = [(y, y) for y in unique_years]
        else:
            k = min(slice_count, len(unique_years))
            step = len(unique_years) / k
            time_slices = []
            for i in range(k):
                start_idx = int(i * step)
                end_idx = int((i + 1) * step) if i < k - 1 else len(unique_years)
                chunk = unique_years[start_idx:end_idx]
                if chunk:
                    time_slices.append((chunk[0], chunk[-1]))

    stopwords = set(DEFAULT_ACADEMIC_STOPWORDS)
    if exclude_keywords:
        stopwords.update([clean_keyword(k) for k in exclude_keywords])

    # Extract clusters for each time slice
    slice_clusters: List[Dict[str, Any]] = []
    all_sankey_nodes: List[Dict[str, Any]] = []

    for s_idx, (y_start, y_end) in enumerate(time_slices):
        slice_label = f"{y_start}-{y_end}" if y_start != y_end else f"{y_start}"
        sub_entries = [
            e
            for e in entries
            if e["year"] is not None and y_start <= e["year"] <= y_end
        ]

        # Aggregate keyword frequencies
        counts: collections.Counter = collections.Counter()
        for e in sub_entries:
            for k in e["extracted_keywords"]:
                if k not in stopwords:
                    counts[k] += 1

        top_kws = [k for k, c in counts.most_common(20) if c >= min_frequency]
        if not top_kws:
            continue

        # Group into top themes (simplified for longitudinal flow)
        chunk_size = max(1, len(top_kws) // 4)
        for th_idx in range(0, min(len(top_kws), 4 * chunk_size), chunk_size):
            group = top_kws[th_idx : th_idx + chunk_size]
            if not group:
                continue
            theme_title = group[0].title()
            node_id = f"T{s_idx}_{theme_title}"
            weight = sum(counts[g] for g in group)

            node_data = {
                "id": node_id,
                "label": f"{theme_title} ({slice_label})",
                "period": slice_label,
                "slice_index": s_idx,
                "keywords": set(group),
                "weight": weight,
            }
            all_sankey_nodes.append(node_data)

    # Compute longitudinal flow streams via Inclusion Index: |U ∩ V| / min(|U|, |V|)
    flows = []
    for i in range(len(all_sankey_nodes)):
        for j in range(len(all_sankey_nodes)):
            n1 = all_sankey_nodes[i]
            n2 = all_sankey_nodes[j]
            # Must connect consecutive time slices
            if n2["slice_index"] == n1["slice_index"] + 1:
                set1, set2 = n1["keywords"], n2["keywords"]
                overlap = len(set1.intersection(set2))
                if overlap > 0:
                    inc_index = overlap / min(len(set1), len(set2))
                    flows.append(
                        {
                            "source": n1["id"],
                            "target": n2["id"],
                            "value": round(
                                float(inc_index * min(n1["weight"], n2["weight"])), 2
                            ),
                            "inclusion_index": round(float(inc_index), 3),
                        }
                    )

    return {
        "time_slices": [
            f"{s[0]}-{s[1]}" if s[0] != s[1] else f"{s[0]}" for s in time_slices
        ],
        "nodes": [
            {
                "id": n["id"],
                "name": n["label"],
                "period": n["period"],
                "value": n["weight"],
            }
            for n in all_sankey_nodes
        ],
        "links": flows,
    }


def compute_bibliometric_laws(file_path: Path) -> Dict[str, Any]:
    """Computes Bradford's Law of Scattering and Lotka's Law of Author Productivity."""
    entries = parse_bibtex_corpus(file_path)

    # 1. BRADFORD'S LAW (Sources / Journals)
    journal_counts: collections.Counter = collections.Counter()
    for e in entries:
        j = e["journal"].strip() if e["journal"] else "Unspecified Source"
        journal_counts[j] += 1

    ranked_sources = journal_counts.most_common()
    total_articles = sum(c for _, c in ranked_sources)
    zone_target = total_articles / 3.0

    zone1_sources = []
    zone2_sources = []
    zone3_sources = []
    cum = 0

    bradford_curve = []
    for rank, (src, count) in enumerate(ranked_sources, start=1):
        cum += count
        bradford_curve.append(
            {
                "rank": rank,
                "ln_rank": round(math.log(rank), 3),
                "source": src,
                "articles": count,
                "cum_articles": cum,
            }
        )
        if len(zone1_sources) == 0 or (
            cum <= zone_target and len(zone2_sources) == 0 and len(zone3_sources) == 0
        ):
            zone1_sources.append(src)
        elif len(zone2_sources) == 0 or (
            cum <= 2 * zone_target and len(zone3_sources) == 0
        ):
            zone2_sources.append(src)
        else:
            zone3_sources.append(src)

    n1, n2, n3 = len(zone1_sources), len(zone2_sources), len(zone3_sources)
    k1 = round(n2 / n1, 2) if n1 > 0 else 1.0
    k2 = round(n3 / n2, 2) if n2 > 0 else 1.0
    avg_k = round((k1 + k2) / 2.0, 2)

    # Use continuous rank cutoff (n + 0.5) so Zone 1 never has ln(1)=0 zero width
    z1_cutoff = round(math.log(max(1.0, n1 + 0.5)), 3)
    z2_cutoff = round(math.log(max(1.5, n1 + n2 + 0.5)), 3)

    bradford_result = {
        "total_sources": len(ranked_sources),
        "total_articles": total_articles,
        "zone1": {
            "name": "Core Sources",
            "source_count": n1,
            "article_count": sum(journal_counts[s] for s in zone1_sources),
        },
        "zone2": {
            "name": "Moderate Sources",
            "source_count": n2,
            "article_count": sum(journal_counts[s] for s in zone2_sources),
        },
        "zone3": {
            "name": "Peripheral Sources",
            "source_count": n3,
            "article_count": sum(journal_counts[s] for s in zone3_sources),
        },
        "bradford_multiplier": avg_k,
        "zone1_cutoff_ln_rank": z1_cutoff,
        "zone2_cutoff_ln_rank": z2_cutoff,
        "curve": bradford_curve[:40],  # Top 40 sources for clean charting
    }

    # 2. LOTKA'S LAW (Author Productivity: y = C / x^n)
    author_counts: collections.Counter = collections.Counter()
    for e in entries:
        for a in e["author_list"]:
            author_counts[a] += 1

    author_dist: collections.Counter = collections.Counter(author_counts.values())
    total_authors = len(author_counts)

    # Estimate exponent n using linear regression on log-log
    # ln(y) = ln(C) - n * ln(x)
    x_vals = sorted(author_dist.keys())
    log_x = [math.log(x) for x in x_vals]
    log_y = [math.log(author_dist[x]) for x in x_vals]

    if len(x_vals) > 1:
        # Fit OLS slope
        x_mean = sum(log_x) / len(log_x)
        y_mean = sum(log_y) / len(log_y)
        numerator = sum((lx - x_mean) * (ly - y_mean) for lx, ly in zip(log_x, log_y))
        denominator = sum((lx - x_mean) ** 2 for lx in log_x)
        slope = numerator / denominator if denominator > 0 else -2.0
        n_exponent = abs(slope)
        c_constant = math.exp(y_mean - slope * x_mean)
    else:
        n_exponent = 2.0
        c_constant = float(author_dist[x_vals[0]]) if x_vals else 1.0

    # Kolmogorov-Smirnov test for goodness of fit
    cum_empirical = 0.0
    cum_theoretical = 0.0
    d_max = 0.0
    lotka_plot = []

    # Theoretical normalizer sum(1 / x^n)
    zeta_approx = sum(1.0 / (x**n_exponent) for x in range(1, 100))
    p1_theo = 1.0 / zeta_approx if zeta_approx > 0 else 0.6

    for x in x_vals:
        observed_y = author_dist[x]
        p_emp = observed_y / total_authors if total_authors > 0 else 0.0
        p_theo = p1_theo / (x**n_exponent)

        cum_empirical += p_emp
        cum_theoretical += p_theo
        d_diff = abs(cum_empirical - cum_theoretical)
        if d_diff > d_max:
            d_max = d_diff

        lotka_plot.append(
            {
                "papers": x,
                "observed_authors": observed_y,
                "expected_authors": round(p_theo * total_authors, 1),
                "empirical_freq": round(p_emp, 4),
                "theoretical_freq": round(p_theo, 4),
            }
        )

    # Critical KS value at alpha = 0.05 is 1.63 / sqrt(N)
    ks_critical = (
        round(1.63 / math.sqrt(total_authors), 4) if total_authors > 0 else 0.05
    )
    is_fit = d_max <= ks_critical

    lotka_result = {
        "total_authors": total_authors,
        "n_exponent": round(n_exponent, 3),
        "c_constant": round(c_constant, 2),
        "ks_statistic": round(d_max, 4),
        "ks_critical_value": ks_critical,
        "is_fit": is_fit,
        "plot": lotka_plot[:15],
    }

    return {
        "bradford": bradford_result,
        "lotka": lotka_result,
    }


def generate_bibliometric_tikz(graph_type: str, data: Dict[str, Any]) -> str:
    """Generates pure LaTeX TikZ or PGFPlots vector code to embed directly into the manuscript."""
    if graph_type == "thematic_map":
        clusters = data.get("clusters", [])
        med_c = data.get("median_centrality", 0.0)
        med_d = data.get("median_density", 0.0)

        lines = [
            r"\begin{figure}[htbp]",
            r"\centering",
            r"\begin{tikzpicture}",
            r"  \begin{axis}[",
            r"    title={Thematic Map (Callon's Centrality vs. Density)},",
            r"    xlabel={Centrality (Relevance Degree)},",
            r"    ylabel={Density (Development Degree)},",
            r"    grid=major,",
            r"    width=11cm, height=8.5cm,",
            r"    scatter/classes={",
            r"      motor={mark=*,draw=blue!80!black,fill=blue!40},",
            r"      niche={mark=*,draw=purple!80!black,fill=purple!40},",
            r"      emerging={mark=*,draw=red!80!black,fill=red!40},",
            r"      basic={mark=*,draw=green!60!black,fill=green!40}",
            r"    }",
            r"  ]",
            f"  % Median threshold lines",
            f"  \\draw[dashed, red!70, thick] (axis cs:{med_c},\\pgfkeysvalueof{{/pgfplots/ymin}}) -- (axis cs:{med_c},\\pgfkeysvalueof{{/pgfplots/ymax}});",
            f"  \\draw[dashed, red!70, thick] (\\pgfkeysvalueof{{/pgfplots/xmin}}, axis cs:{med_d}) -- (\\pgfkeysvalueof{{/pgfplots/xmax}}, axis cs:{med_d});",
            r"  \addplot[scatter, only marks, scatter src=explicit symbolic, mark size=4pt]",
            r"    coordinates {",
        ]

        class_map = {
            "Motor Themes": "motor",
            "Niche Themes": "niche",
            "Emerging or Declining": "emerging",
            "Basic & Transversal": "basic",
        }

        for c in clusters:
            c_type = class_map.get(c.get("quadrant", ""), "basic")
            x = c.get("centrality", 0.0)
            y = c.get("density", 0.0)
            lines.append(f"      ({x}, {y}) [{c_type}]")

        lines.extend(
            [
                r"    };",
                r"  \end{axis}",
                r"\end{tikzpicture}",
                r"\caption{Strategic Thematic Map of Explainable AI (XAI) literature.}",
                r"\label{fig:xai_thematic_map}",
                r"\end{figure}",
            ]
        )
        return "\n".join(lines)

    elif graph_type == "bradford":
        curve = data.get("bradford", {}).get("curve", [])
        lines = [
            r"\begin{figure}[htbp]",
            r"\centering",
            r"\begin{tikzpicture}",
            r"  \begin{axis}[",
            r"    title={Bradford's Law of Scattering Curve},",
            r"    xlabel={$\ln(\text{Rank of Journals})$},",
            r"    ylabel={Cumulative Articles},",
            r"    grid=major,",
            r"    width=11cm, height=7.5cm",
            r"  ]",
            r"  \addplot[thick, color=blue!80!black, mark=*] coordinates {",
        ]
        for pt in curve:
            lines.append(f"    ({pt['ln_rank']}, {pt['cum_articles']})")
        lines.extend(
            [
                r"  };",
                r"  \end{axis}",
                r"\end{tikzpicture}",
                r"\caption{Bradford's Law cumulative source productivity distribution.}",
                r"\label{fig:bradford_law}",
                r"\end{figure}",
            ]
        )
        return "\n".join(lines)

    # Fallback
    return "% TikZ code not available for this graph type"
