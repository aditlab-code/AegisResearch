#!/usr/bin/env bash
# SDD and CodeGraph AST Cache Hook
# Manages differential caching of specs and touched files to accelerate /spec and /plan.
set -euo pipefail

CACHE_DIR=".aegis/cache/codegraph"
mkdir -p "$CACHE_DIR"

TOUCHED_TARGET="${1:-${TOOL_TARGET:-}}"

if [ -n "$TOUCHED_TARGET" ]; then
    # Invalidate or update cache entry timestamp
    CACHE_KEY=$(echo -n "$TOUCHED_TARGET" | (md5sum 2>/dev/null || md5 -q 2>/dev/null || cksum | cut -d' ' -f1))
    echo "TOUCHED: $TOUCHED_TARGET at $(date +%s)" > "$CACHE_DIR/$CACHE_KEY.meta"
fi

exit 0
