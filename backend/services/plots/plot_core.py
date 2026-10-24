"""plot_core.py — Core utility functions and LaTeX snippet generator for plots."""

from __future__ import annotations

import base64
import io
import re
from pathlib import Path

import matplotlib

# Mandatory headless backend
matplotlib.use("Agg")
import matplotlib.pyplot as plt


def _sanitize_filename(name: str) -> str:
    """Sanitizes variable name for safe filesystem path."""
    return re.sub(r"[^\w\-.]", "_", name)


def _fig_to_base64(fig: plt.Figure) -> str:
    """Encodes Matplotlib figure to Base64 PNG data URL for 0-latency UI display."""
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=300, bbox_inches="tight")
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def _ensure_plot_dir(project_dir: Path) -> Path:
    """Ensures `{project_dir}/assets/stats_plots` directory exists."""
    plot_dir = project_dir / "assets" / "stats_plots"
    plot_dir.mkdir(parents=True, exist_ok=True)
    return plot_dir


def _save_and_encode_fig(
    fig: plt.Figure, project_dir: Path, filename: str
) -> tuple[Path, str, str]:
    """Saves figure to disk at 300 DPI, encodes Base64 data URL, and closes figure."""
    plot_dir = _ensure_plot_dir(project_dir)
    out_path = plot_dir / filename
    rel_path = f"assets/stats_plots/{filename}"
    plt.tight_layout()
    data_url = _fig_to_base64(fig)
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(fig)
    return out_path, rel_path, data_url


def generate_figure_latex_snippet(
    image_rel_path: str,
    caption: str,
    label: str,
    width: str = r"0.85\linewidth",
) -> str:
    """Formats LaTeX figure snippet for inclusion in scholarly drafts."""
    return (
        r"\begin{figure}[htbp]" + "\n"
        r"  \centering" + "\n"
        f"  \\includegraphics[width={width}]{{{image_rel_path}}}\n"
        f"  \\caption{{{caption}}}\n"
        f"  \\label{{{label}}}\n"
        r"\end{figure}"
    )
