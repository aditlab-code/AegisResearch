#!/usr/bin/env bash
# ==============================================================================
# Aegis Research (Scholarly LaTeX IDE) - Fullstack Concurrent Runner
# Starts FastAPI backend (port 8000) and Vite frontend (port 5173) with clean shutdown.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ANSI styling
if [ -t 1 ]; then
  BOLD="\033[1m"
  GREEN="\033[0;32m"
  BLUE="\033[0;34m"
  YELLOW="\033[1;33m"
  RED="\033[0;31m"
  CYAN="\033[0;36m"
  RESET="\033[0m"
else
  BOLD=""
  GREEN=""
  BLUE=""
  YELLOW=""
  RED=""
  CYAN=""
  RESET=""
fi

log_info() {
  echo -e "${BLUE}${BOLD}[INFO]${RESET} $1"
}

log_success() {
  echo -e "${GREEN}${BOLD}[SUCCESS]${RESET} $1"
}

log_warn() {
  echo -e "${YELLOW}${BOLD}[WARNING]${RESET} $1"
}

log_error() {
  echo -e "${RED}${BOLD}[ERROR]${RESET} $1"
}

FORCE_KILL=false
for arg in "$@"; do
  if [ "$arg" = "--force" ] || [ "$arg" = "-f" ] || [ "$arg" = "--kill" ]; then
    FORCE_KILL=true
  fi
done

# ------------------------------------------------------------------------------
# 1. Verify Prerequisites
# ------------------------------------------------------------------------------
VENV_DIR="$SCRIPT_DIR/backend/.venv"
if [ ! -d "$VENV_DIR" ] || [ ! -f "$VENV_DIR/bin/python" ]; then
  log_error "Python virtual environment not found in 'backend/.venv'."
  echo "  Please run './setup.sh' first to install all dependencies."
  exit 1
fi

if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  log_error "Node dependencies not found in 'node_modules'."
  echo "  Please run './setup.sh' first to install all dependencies."
  exit 1
fi

# ------------------------------------------------------------------------------
# 2. Check & Handle Port Collisions (8000 & 5173)
# ------------------------------------------------------------------------------
has_collision=false

check_and_handle_port() {
  local port="$1"
  local pid=""
  if command -v lsof >/dev/null 2>&1; then
    pid="$(lsof -i ":$port" -sTCP:LISTEN -t 2>/dev/null || true)"
  fi

  if [ -n "$pid" ]; then
    if [ "$FORCE_KILL" = true ]; then
      log_warn "Terminating existing process (PID $pid) listening on port $port..."
      kill -9 "$pid" 2>/dev/null || true
      sleep 0.5
    else
      log_error "Port $port is already in use by process PID $pid."
      has_collision=true
    fi
  fi
}

check_and_handle_port 8000
check_and_handle_port 5173

if [ "$has_collision" = true ]; then
  echo ""
  log_info "Another server instance is already running on port 8000 or 5173."
  echo "  Options:"
  echo "    1. Run './run.sh --force' to terminate the existing instances and restart."
  echo "    2. Or kill manually: kill -9 \$(lsof -ti :8000 -ti :5173)"
  echo ""
  exit 1
fi

# ------------------------------------------------------------------------------
# 3. Process Management & Signal Trap
# ------------------------------------------------------------------------------
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  log_info "Received stop signal. Shutting down fullstack servers..."

  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill -TERM "$FRONTEND_PID" 2>/dev/null || true
  fi

  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
  fi

  sleep 0.5

  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill -9 "$FRONTEND_PID" 2>/dev/null || true
  fi

  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill -9 "$BACKEND_PID" 2>/dev/null || true
  fi

  log_success "All Aegis Research services stopped cleanly."
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# ------------------------------------------------------------------------------
# 4. Launch Services Concurrently
# ------------------------------------------------------------------------------
echo -e "${CYAN}${BOLD}"
echo "======================================================================"
echo "          Aegis Research (Scholarly LaTeX IDE) Fullstack Runner       "
echo "======================================================================"
echo -e "${RESET}"
log_info "Starting FastAPI backend server on http://localhost:8000..."
"$VENV_DIR/bin/python" -m backend.main &
BACKEND_PID=$!

log_info "Starting Vite frontend dev server on http://localhost:5173..."
npm run dev:frontend &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}${BOLD}----------------------------------------------------------------------${RESET}"
echo -e "${GREEN}${BOLD}  * IDE Web Interface:  ${RESET}${CYAN}${BOLD}http://localhost:5173${RESET}"
echo -e "${GREEN}${BOLD}  * Backend API Docs:   ${RESET}${CYAN}${BOLD}http://localhost:8000/docs${RESET}"
echo -e "${GREEN}${BOLD}  * Workspace Directory:${RESET} ${SCRIPT_DIR}/backend/latex_workspaces"
echo -e "${GREEN}${BOLD}----------------------------------------------------------------------${RESET}"
echo -e "Press ${YELLOW}${BOLD}Ctrl + C${RESET} at any time to shut down both servers.\n"

# Wait for both processes
wait "$BACKEND_PID" "$FRONTEND_PID" || true
