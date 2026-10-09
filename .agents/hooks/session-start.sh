#!/usr/bin/env bash
# Session Start Hook for Olympus Agent Framework & CodeGraph
set -euo pipefail

# 1. Pastikan RTK tersedia
if command -v rtk >/dev/null 2>&1; then
    echo "[Olympus Hook] RTK utility detected at $(which rtk)"
else
    echo "[Olympus Hook] Warning: RTK utility not in PATH. Fallback to native tools (rg, find, git)."
fi

# 2. Pastikan direktori .agents/.aegis/ dan .agents/data/ ada
mkdir -p .agents/.aegis/cache
mkdir -p .agents/data

# 3. Validasi kesiapan CodeGraph store dan inisialisasi state lifecycle
if [ -f ".agents/data/aegis.db" ] || [ -d ".agents/.aegis" ]; then
    echo "[Olympus Hook] CodeGraph storage ready."
fi

PYTHONPATH=src python3 -m agent_ai.runtime.olympus_workflow status >/dev/null 2>&1 || true

echo "[Olympus Hook] Olympus Agent Framework initialized. Active personas: zeus, athena, hermes, hephaestus, heracles, themis."
exit 0
