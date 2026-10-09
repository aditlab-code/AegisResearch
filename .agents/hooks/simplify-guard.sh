#!/usr/bin/env bash
# Simplify Guard Hook
# Protects critical database, configuration, and secret files from unsafe write/replace operations.
set -euo pipefail

TARGET="${1:-${TOOL_TARGET:-}}"

if [ -z "$TARGET" ]; then
    exit 0
fi

# Normalize path
NORM_TARGET=$(echo "$TARGET" | tr '\\' '/')

# Check against protected patterns
PROTECTED_PATTERNS=(
    "data/aegis.db"
    ".env"
    "secrets"
    "package-lock.json"
    "poetry.lock"
    "Cargo.lock"
    ".git/"
)

for pattern in "${PROTECTED_PATTERNS[@]}"; do
    if [[ "$NORM_TARGET" == *"$pattern"* ]]; then
        echo "[Simplify Guard ERROR] Modification to protected target '$TARGET' is prohibited without explicit user bypass." >&2
        exit 1
    fi
done

exit 0
