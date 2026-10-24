"""Thematic Map (Callon's 2x2 Strategic Diagram) and Longitudinal Thematic Evolution."""

import collections
from pathlib import Path
from typing import Any

from .bibtex_parser import (
    DEFAULT_ACADEMIC_STOPWORDS,
    BibliometricError,
    clean_keyword,
    parse_bibtex_corpus,
)
from .network_engine import compute_cooccurrence_network


def compute_thematic_map(
    file_path: Path,
    network_type: str = "keywords",
    min_frequency: int = 3,
    top_n: int = 60,
    exclude_keywords: list[str] | None = None,
) -> dict[str, Any]:
    """Calculates Thematic Map (Callon's Centrality & Density 2x2 Strategic Diagram)."""
    net = compute_cooccurrence_network(
        file_path,
        network_type=network_type,
        min_frequency=min_frequency,
        top_n=top_n,
        exclude_keywords=exclude_keywords,
    )

    nodes = {n["id"]: n for n in net["nodes"]}
    cluster_members: dict[int, list[str]] = collections.defaultdict(list)
    for n in net["nodes"]:
        cluster_members[n["cluster"]].append(n["id"])

    # Build adjacency
    edge_weights: dict[tuple[str, str], float] = {}
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
    time_slices: list[tuple[int, int]] | None = None,
    slice_count: int = 3,
    min_frequency: int = 2,
    exclude_keywords: list[str] | None = None,
) -> dict[str, Any]:
    """Computes Thematic Evolution across publication year slices using the Inclusion Index."""
    entries = parse_bibtex_corpus(file_path)
    years = [e["year"] for e in entries if e["year"] is not None]
    if not years:
        raise BibliometricError(
            "No valid publication years found for thematic evolution"
        )

    unique_years = sorted(set(years))

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
    all_sankey_nodes: list[dict[str, Any]] = []

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
