"""Keyword co-occurrence and co-authorship network computation with modularity clustering."""

import collections
import math
from pathlib import Path
from typing import Any

from .bibtex_parser import (
    DEFAULT_ACADEMIC_STOPWORDS,
    BibliometricError,
    clean_keyword,
    parse_bibtex_corpus,
)


def _greedy_modularity_clustering(
    nodes: list[str], links: list[tuple[str, str, float]]
) -> dict[str, int]:
    """Lightweight Newman-Girvan modularity community detection with degree resolution penalty."""
    adj: dict[str, dict[str, float]] = collections.defaultdict(dict)
    node_degree: dict[str, float] = collections.defaultdict(float)
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
    community: dict[str, int] = {n: i for i, n in enumerate(nodes)}
    comm_tot: dict[int, float] = {i: node_degree[n] for i, n in enumerate(nodes)}

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
            comm_links: dict[int, float] = collections.defaultdict(float)
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
    unique_comms = sorted(set(community.values()))
    comm_map = {old: new for new, old in enumerate(unique_comms)}
    return {n: comm_map[c] for n, c in community.items()}


def compute_cooccurrence_network(
    file_path: Path,
    network_type: str = "keywords",
    min_frequency: int = 3,
    top_n: int = 50,
    exclude_keywords: list[str] | None = None,
    method: str = "equivalence",
) -> dict[str, Any]:
    """Computes co-occurrence network with Louvain community detection and association normalization."""
    entries = parse_bibtex_corpus(file_path)

    stopwords = set(DEFAULT_ACADEMIC_STOPWORDS)
    if exclude_keywords:
        stopwords.update([clean_keyword(k) for k in exclude_keywords])

    # Count item occurrences
    item_counts: collections.Counter = collections.Counter()
    doc_items: list[list[str]] = []

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
    raw_links: list[tuple[str, str, float]] = []
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
    cluster_members: dict[int, list[str]] = collections.defaultdict(list)
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
