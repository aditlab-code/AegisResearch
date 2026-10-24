"""Scientometric laws computation: Bradford's Law of Scattering and Lotka's Law of Author Productivity."""

import collections
import math
from pathlib import Path
from typing import Any

from .bibtex_parser import parse_bibtex_corpus


def compute_bibliometric_laws(file_path: Path) -> dict[str, Any]:
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
        d_max = max(d_max, d_diff)

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
