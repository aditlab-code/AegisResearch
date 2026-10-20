import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Table,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  RefreshCw,
  Hash,
  Database,
  ArrowRight,
} from "lucide-react";
import { Doc } from "../../types";
import { buildApiUrl } from "../../services";

export interface DatasetViewerTabProps {
  doc: Doc;
  projectName: string;
}

interface ColumnInfo {
  name: string;
  type: string;
}

interface DatasetSchema {
  filename: string;
  total_rows: number;
  total_columns: number;
  columns: ColumnInfo[];
}

export const DatasetViewerTab: React.FC<DatasetViewerTabProps> = ({
  doc,
  projectName,
}) => {
  const [schema, setSchema] = useState<DatasetSchema | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Windowing state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [colOffset, setColOffset] = useState(0);
  const [colLimit, setColLimit] = useState(40);

  // Loaded data window
  const [columns, setColumns] = useState<string[]>([]);
  const [data, setData] = useState<(string | number | null)[][]>([]);

  // Column search / filter
  const [colSearchQuery, setColSearchQuery] = useState("");
  const [jumpRowInput, setJumpRowInput] = useState("");

  const filePath = doc.path || doc.name;

  // 1. Fetch schema on mount or file change
  const fetchSchema = useCallback(async () => {
    setLoadingSchema(true);
    setError(null);
    try {
      const url = buildApiUrl(
        `/api/projects/${encodeURIComponent(projectName)}/dataset/schema`,
        { path: filePath },
      );
      const res = await fetch(url);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `HTTP ${res.status}`);
      }
      const data: DatasetSchema = await res.json();
      setSchema(data);
      setPage(0);
      setColOffset(0);
    } catch (err: any) {
      setError(err.message || "Failed to load dataset schema");
    } finally {
      setLoadingSchema(false);
    }
  }, [projectName, filePath]);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  // 2. Fetch data slice whenever page, pageSize, colOffset, or colLimit changes
  const fetchDataSlice = useCallback(async () => {
    if (!schema) return;
    setLoadingData(true);
    const rowOffset = page * pageSize;
    try {
      const url = buildApiUrl(
        `/api/projects/${encodeURIComponent(projectName)}/dataset/slice`,
        {
          path: filePath,
          row_offset: rowOffset,
          row_limit: pageSize,
          col_offset: colOffset,
          col_limit: colLimit,
        },
      );
      const res = await fetch(url);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `HTTP ${res.status}`);
      }
      const sliceRes = await res.json();
      setColumns(sliceRes.columns || []);
      setData(sliceRes.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load data slice");
    } finally {
      setLoadingData(false);
    }
  }, [projectName, filePath, schema, page, pageSize, colOffset, colLimit]);

  useEffect(() => {
    if (schema) {
      fetchDataSlice();
    }
  }, [schema, page, pageSize, colOffset, colLimit, fetchDataSlice]);

  const totalPages = schema ? Math.ceil(schema.total_rows / pageSize) : 0;
  const totalCols = schema ? schema.total_columns : 0;

  // Filter columns based on user search in dropdown/filter
  const filteredSchemaCols = useMemo(() => {
    if (!schema) return [];
    if (!colSearchQuery.trim()) return schema.columns;
    const q = colSearchQuery.toLowerCase();
    return schema.columns.filter((c) => c.name.toLowerCase().includes(q));
  }, [schema, colSearchQuery]);

  const handleJumpToRow = (e: React.FormEvent) => {
    e.preventDefault();
    const rowNum = parseInt(jumpRowInput.trim(), 10);
    if (!isNaN(rowNum) && schema) {
      const clampedRow = Math.max(1, Math.min(rowNum, schema.total_rows));
      const targetPage = Math.floor((clampedRow - 1) / pageSize);
      setPage(targetPage);
      setJumpRowInput("");
    }
  };

  const handleJumpToColumn = (colName: string) => {
    if (!schema) return;
    const idx = schema.columns.findIndex((c) => c.name === colName);
    if (idx !== -1) {
      setColOffset(idx);
    }
  };

  const handleDownloadRaw = () => {
    const rawUrl = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/raw/${encodeURIComponent(filePath)}`,
    );
    window.open(rawUrl, "_blank");
  };

  if (loadingSchema) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-500 gap-3">
        <RefreshCw className="size-6 animate-spin text-amber-500" />
        <span className="text-xs font-mono">
          Scanning dataset metadata via Polars lazy engine...
        </span>
      </div>
    );
  }

  if (error && !schema) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-600 p-6">
        <div className="size-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-500 mb-3">
          <Database className="size-6" />
        </div>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
          Failed to Open Dataset
        </p>
        <p className="text-xs text-red-500 max-w-md text-center mb-4">
          {error}
        </p>
        <button
          type="button"
          onClick={fetchSchema}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="size-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const startRow = page * pageSize + 1;
  const endRow = schema
    ? Math.min((page + 1) * pageSize, schema.total_rows)
    : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-900 select-none overflow-hidden text-xs">
      {/* Top Header Bar: Info & Controls */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-zinc-100/80 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 gap-2">
        <div className="flex items-center gap-2">
          <Table className="size-4 text-amber-500 shrink-0" />
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-xs">
            {doc.name}
          </span>
          {schema && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-900/50">
                {schema.total_rows.toLocaleString()} rows
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {schema.total_columns.toLocaleString()} columns
              </span>
            </div>
          )}
          {loadingData && (
            <RefreshCw className="size-3 animate-spin text-blue-500 ml-1 shrink-0" />
          )}
        </div>

        {/* Column Navigator & Jump to Row */}
        <div className="flex items-center gap-2">
          {/* Quick jump to row input */}
          <form
            onSubmit={handleJumpToRow}
            className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-1.5 py-0.5"
          >
            <Hash className="size-3 text-zinc-400 mr-1 shrink-0" />
            <input
              type="text"
              placeholder="Jump to row..."
              value={jumpRowInput}
              onChange={(e) => setJumpRowInput(e.target.value)}
              className="w-20 bg-transparent text-[11px] outline-none text-zinc-800 dark:text-zinc-200"
            />
            <button
              type="submit"
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5"
            >
              <ArrowRight className="size-3" />
            </button>
          </form>

          {/* Column filter search */}
          <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-1.5 py-0.5">
            <Search className="size-3 text-zinc-400 mr-1 shrink-0" />
            <input
              type="text"
              placeholder="Find column..."
              value={colSearchQuery}
              onChange={(e) => setColSearchQuery(e.target.value)}
              className="w-24 bg-transparent text-[11px] outline-none text-zinc-800 dark:text-zinc-200"
            />
            {colSearchQuery && (
              <div className="absolute top-full left-0 mt-1 w-48 max-h-48 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded z-50 py-1">
                {filteredSchemaCols.slice(0, 30).map((col) => (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => {
                      handleJumpToColumn(col.name);
                      setColSearchQuery("");
                    }}
                    className="w-full text-left px-2.5 py-1 text-[11px] hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between"
                  >
                    <span className="truncate text-zinc-800 dark:text-zinc-200 font-mono">
                      {col.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {col.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Download Raw */}
          <button
            type="button"
            onClick={handleDownloadRaw}
            title="Download Raw File"
            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          >
            <Download className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Main Table Grid View with Virtual Horizontal & Vertical Scroll */}
      <div className="flex-1 overflow-auto bg-zinc-50 dark:bg-zinc-950 font-mono text-[11px]">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-20 bg-zinc-100 dark:bg-zinc-800 shadow-xs">
            <tr>
              {/* Row index header sticky on left */}
              <th className="sticky left-0 z-30 bg-zinc-200 dark:bg-zinc-900 px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-300 border-b border-r border-zinc-300 dark:border-zinc-700 w-16">
                #
              </th>
              {columns.map((colName, cIdx) => {
                const schemaCol = schema?.columns.find(
                  (c) => c.name === colName,
                );
                return (
                  <th
                    key={colName}
                    className="px-3 py-2 text-left font-semibold text-zinc-800 dark:text-zinc-200 border-b border-r border-zinc-200 dark:border-zinc-700 whitespace-nowrap min-w-[120px] max-w-[200px]"
                  >
                    <div className="flex flex-col">
                      <span className="truncate">{colName}</span>
                      {schemaCol && (
                        <span className="text-[9px] font-normal text-zinc-500 dark:text-zinc-400">
                          {schemaCol.type}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rIdx) => {
              const globalRowNum = page * pageSize + rIdx + 1;
              const isEven = rIdx % 2 === 0;
              return (
                <tr
                  key={rIdx}
                  className={`${
                    isEven
                      ? "bg-white dark:bg-zinc-900"
                      : "bg-zinc-50/70 dark:bg-zinc-950/60"
                  } hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-colors`}
                >
                  {/* Sticky row number column */}
                  <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 text-zinc-500 dark:text-zinc-400 border-b border-r border-zinc-200 dark:border-zinc-800 text-right select-none font-medium">
                    {globalRowNum.toLocaleString()}
                  </td>
                  {row.map((val, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-3 py-1.5 text-zinc-700 dark:text-zinc-300 border-b border-r border-zinc-200/80 dark:border-zinc-800/80 whitespace-nowrap truncate max-w-[220px]"
                      title={val !== null ? String(val) : "null"}
                    >
                      {val === null ? (
                        <span className="text-zinc-400 italic font-sans text-[10px]">
                          null
                        </span>
                      ) : (
                        String(val)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {data.length === 0 && !loadingData && (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
            <p>No data available in this slice.</p>
          </div>
        )}
      </div>

      {/* Bottom Pagination & Column Viewport Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-zinc-100/90 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 gap-2">
        {/* Row range info */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px]">
            Showing rows{" "}
            <strong className="text-zinc-800 dark:text-zinc-200">
              {startRow.toLocaleString()}
            </strong>{" "}
            -{" "}
            <strong className="text-zinc-800 dark:text-zinc-200">
              {endRow.toLocaleString()}
            </strong>{" "}
            of{" "}
            <strong className="text-zinc-800 dark:text-zinc-200">
              {schema?.total_rows.toLocaleString()}
            </strong>
          </span>

          <span className="text-zinc-300 dark:text-zinc-700">|</span>

          {/* Page size selector */}
          <div className="flex items-center gap-1">
            <span className="text-[11px]">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-1.5 py-0.5 text-[11px] outline-none text-zinc-800 dark:text-zinc-200"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>

        {/* Column chunk paging & Row navigation */}
        <div className="flex items-center gap-3">
          {/* Column range navigation */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-0.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
              Columns:
            </span>
            <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
              {colOffset + 1}..{Math.min(colOffset + colLimit, totalCols)} of{" "}
              {totalCols}
            </span>
            <button
              type="button"
              disabled={colOffset === 0}
              onClick={() =>
                setColOffset((prev) => Math.max(0, prev - colLimit))
              }
              title="Previous Columns"
              className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-30"
            >
              <ChevronLeft className="size-3" />
            </button>
            <button
              type="button"
              disabled={colOffset + colLimit >= totalCols}
              onClick={() =>
                setColOffset((prev) =>
                  Math.min(totalCols - colLimit, prev + colLimit),
                )
              }
              title="Next Columns"
              className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded disabled:opacity-30"
            >
              <ChevronRight className="size-3" />
            </button>
          </div>

          {/* Row pagination buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(0)}
              title="First Page"
              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30"
            >
              <ChevronsLeft className="size-3.5" />
            </button>
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              title="Previous Page"
              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="font-mono text-[11px] px-2 text-zinc-700 dark:text-zinc-300">
              Page {page + 1} of {totalPages || 1}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              title="Next Page"
              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30"
            >
              <ChevronRight className="size-3.5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(totalPages - 1)}
              title="Last Page"
              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30"
            >
              <ChevronsRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
