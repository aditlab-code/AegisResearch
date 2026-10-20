"""Dataset service for high-performance lazy loading, schema inspection, and windowed slicing

of large tabular datasets (CSV, TSV, Parquet) using Polars.
"""

import math
from pathlib import Path
from typing import Any, Dict, List


class DatasetError(Exception):
    pass


SUPPORTED_DATASET_EXTS = {".csv", ".tsv", ".parquet", ".pqt"}


def is_dataset_file(file_path: Path) -> bool:
    return file_path.suffix.lower() in SUPPORTED_DATASET_EXTS


def get_dataset_schema(file_path: Path) -> Dict[str, Any]:
    """Inspect schema and row count lazily without loading full dataset into memory."""
    if not file_path.exists() or not file_path.is_file():
        raise FileNotFoundError(f"Dataset file not found: {file_path.name}")

    suffix = file_path.suffix.lower()
    if suffix not in SUPPORTED_DATASET_EXTS:
        raise ValueError(f"Unsupported dataset format: {suffix}")

    try:
        import polars as pl
    except ImportError as e:
        raise DatasetError("Polars is not installed in environment") from e

    try:
        if suffix in {".parquet", ".pqt"}:
            lf = pl.scan_parquet(file_path)
        else:
            sep = "\t" if suffix == ".tsv" else ","
            lf = pl.scan_csv(file_path, separator=sep)

        schema = lf.collect_schema()
        # Fast query for total row count
        total_rows = lf.select(pl.len()).collect().item()

        columns = [{"name": col, "type": str(dtype)} for col, dtype in schema.items()]

        return {
            "filename": file_path.name,
            "total_rows": int(total_rows),
            "total_columns": len(columns),
            "columns": columns,
        }
    except Exception as e:
        raise DatasetError(f"Failed to inspect dataset schema: {e}") from e


def get_dataset_slice(
    file_path: Path,
    row_offset: int = 0,
    row_limit: int = 100,
    col_offset: int = 0,
    col_limit: int = 50,
) -> Dict[str, Any]:
    """Fetch an on-demand window (slice) of rows and columns lazily."""
    if not file_path.exists() or not file_path.is_file():
        raise FileNotFoundError(f"Dataset file not found: {file_path.name}")

    suffix = file_path.suffix.lower()
    if suffix not in SUPPORTED_DATASET_EXTS:
        raise ValueError(f"Unsupported dataset format: {suffix}")

    try:
        import polars as pl
    except ImportError as e:
        raise DatasetError("Polars is not installed in environment") from e

    try:
        if suffix in {".parquet", ".pqt"}:
            lf = pl.scan_parquet(file_path)
        else:
            sep = "\t" if suffix == ".tsv" else ","
            lf = pl.scan_csv(file_path, separator=sep)

        schema = lf.collect_schema()
        all_cols = schema.names()
        total_cols = len(all_cols)

        # Safe bounds
        safe_col_offset = max(0, min(col_offset, total_cols))
        safe_col_limit = max(1, min(col_limit, 500))
        selected_cols = all_cols[safe_col_offset : safe_col_offset + safe_col_limit]

        safe_row_offset = max(0, row_offset)
        safe_row_limit = max(1, min(row_limit, 500))

        if not selected_cols:
            return {
                "row_offset": safe_row_offset,
                "row_limit": safe_row_limit,
                "col_offset": safe_col_offset,
                "col_limit": 0,
                "columns": [],
                "data": [],
            }

        df_slice = (
            lf.select(selected_cols).slice(safe_row_offset, safe_row_limit).collect()
        )

        rows: List[List[Any]] = []
        for row in df_slice.iter_rows():
            clean_row = []
            for val in row:
                if val is None:
                    clean_row.append(None)
                elif isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
                    clean_row.append(None)
                else:
                    clean_row.append(val)
            rows.append(clean_row)

        return {
            "row_offset": safe_row_offset,
            "row_limit": safe_row_limit,
            "col_offset": safe_col_offset,
            "col_limit": len(selected_cols),
            "columns": selected_cols,
            "data": rows,
        }
    except Exception as e:
        raise DatasetError(f"Failed to slice dataset: {e}") from e
