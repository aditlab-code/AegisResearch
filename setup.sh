#!/usr/bin/env bash
# ==============================================================================
# Aegis Research (Scholarly LaTeX IDE) - Fullstack Setup & Dependency Installer
# Supported Platforms: macOS, Debian/Ubuntu, Fedora, Windows (WSL)
# ==============================================================================

set -euo pipefail

# Resolve project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Text styles & ANSI colors
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

log_step() {
  echo -e "\n${CYAN}${BOLD}==>${RESET} ${BOLD}$1${RESET}"
}

echo -e "${CYAN}${BOLD}"
echo "======================================================================"
echo "    Aegis Research (Scholarly LaTeX IDE) - Environment Setup v0.1.0   "
echo "======================================================================"
echo -e "${RESET}"

# ------------------------------------------------------------------------------
# 1. Detect Operating System & Package Manager
# ------------------------------------------------------------------------------
log_step "1. Detecting Host Operating System"

OS_NAME="$(uname -s)"
DISTRO="unknown"
IS_WSL=false

if [ "$OS_NAME" = "Linux" ]; then
  if grep -qi microsoft /proc/version 2>/dev/null; then
    IS_WSL=true
  fi
  if [ -f /etc/os-release ]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    DISTRO="${ID:-linux}"
  fi
  log_info "Detected OS: Linux ($DISTRO) ${IS_WSL:+[Windows WSL]}"
elif [ "$OS_NAME" = "Darwin" ]; then
  log_info "Detected OS: macOS ($(sw_vers -productVersion 2>/dev/null || echo 'Darwin'))"
else
  log_warn "Operating system '$OS_NAME' may not be fully supported by this script."
fi

# ------------------------------------------------------------------------------
# 2. Check Git
# ------------------------------------------------------------------------------
log_step "2. Checking Git"

if command -v git >/dev/null 2>&1; then
  GIT_VER="$(git --version)"
  log_success "$GIT_VER is installed."
else
  log_error "Git is not installed."
  if [ "$OS_NAME" = "Darwin" ]; then
    echo "  Install via Homebrew: brew install git"
    echo "  Or Xcode Command Line Tools: xcode-select --install"
  elif [ "$DISTRO" = "ubuntu" ] || [ "$DISTRO" = "debian" ]; then
    echo "  Install via APT: sudo apt-get update && sudo apt-get install -y git"
  elif [ "$DISTRO" = "fedora" ]; then
    echo "  Install via DNF: sudo dnf install -y git"
  fi
  exit 1
fi

# ------------------------------------------------------------------------------
# 3. Check / Install LaTeX Engine (pdflatex & bibtex)
# ------------------------------------------------------------------------------
log_step "3. Checking LaTeX Distribution (pdflatex & bibtex)"

find_tex_binary() {
  local bin_name="$1"
  if command -v "$bin_name" >/dev/null 2>&1; then
    command -v "$bin_name"
    return 0
  fi

  local candidates=(
    "/Library/TeX/texbin/$bin_name"
    "/usr/local/texlive/2025/bin/universal-darwin/$bin_name"
    "/usr/local/texlive/2024/bin/universal-darwin/$bin_name"
    "/usr/local/texlive/2023/bin/universal-darwin/$bin_name"
    "/usr/local/bin/$bin_name"
    "/usr/bin/$bin_name"
  )

  for cand in "${candidates[@]}"; do
    if [ -x "$cand" ]; then
      echo "$cand"
      return 0
    fi
  done

  return 1
}

PDFLATEX_PATH="$(find_tex_binary "pdflatex" || true)"
BIBTEX_PATH="$(find_tex_binary "bibtex" || true)"

if [ -n "$PDFLATEX_PATH" ] && [ -n "$BIBTEX_PATH" ]; then
  PDFLATEX_VER="$("$PDFLATEX_PATH" --version | head -n 1)"
  log_success "Found LaTeX compiler: $PDFLATEX_PATH"
  log_info "  Version: $PDFLATEX_VER"
  log_success "Found BibTeX compiler: $BIBTEX_PATH"
else
  log_warn "LaTeX engine (pdflatex and/or bibtex) is not detected in your PATH."
  echo ""
  echo "  Aegis Research requires a local TeX engine to compile documents."
  echo "  Recommended distributions by platform:"
  echo ""
  if [ "$OS_NAME" = "Darwin" ]; then
    echo "  * macOS (Lightweight ~100MB): brew install --cask basictex"
    echo "  * macOS (Full ~5GB):        brew install --cask mactex-no-gui"
    echo "  Note: After installing BasicTeX, reload terminal or ensure /Library/TeX/texbin is in PATH:"
    echo "        export PATH=\"/Library/TeX/texbin:\$PATH\""
  elif [ "$DISTRO" = "ubuntu" ] || [ "$DISTRO" = "debian" ] || [ "$IS_WSL" = true ]; then
    echo "  * Debian/Ubuntu/WSL: sudo apt-get update && sudo apt-get install -y \\"
    echo "      texlive-latex-base texlive-latex-extra texlive-fonts-recommended texlive-bibtex-extra"
  elif [ "$DISTRO" = "fedora" ]; then
    echo "  * Fedora: sudo dnf install -y texlive-scheme-medium texlive-bibtex"
  else
    echo "  * Linux/Other: Please install TeX Live (https://tug.org/texlive/)"
  fi
  echo ""
  read -r -p "  Continue setup anyway? (You can install LaTeX later) [y/N]: " tex_continue || true
  case "${tex_continue:-n}" in
    [yY]|[yY][eE][sS])
      log_warn "Continuing setup without verified LaTeX installation."
      ;;
    *)
      log_info "Aborting setup. Please install LaTeX and run ./setup.sh again."
      exit 1
      ;;
  esac
fi

# ------------------------------------------------------------------------------
# 4. Check Python & Setup Backend Virtual Environment
# ------------------------------------------------------------------------------
log_step "4. Setting up Python Backend Environment"

PYTHON_BIN=""
for cmd in python3 python; do
  if command -v "$cmd" >/dev/null 2>&1; then
    PYTHON_BIN="$cmd"
    break
  fi
done

if [ -z "$PYTHON_BIN" ]; then
  log_error "Python 3 is not found. Please install Python 3.10+."
  exit 1
fi

PY_VERSION="$("$PYTHON_BIN" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
PY_MAJOR="$(echo "$PY_VERSION" | cut -d. -f1)"
PY_MINOR="$(echo "$PY_VERSION" | cut -d. -f2)"

if [ "$PY_MAJOR" -lt 3 ] || { [ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -lt 10 ]; }; then
  log_error "Python $PY_VERSION detected. Python 3.10 or higher is required."
  exit 1
fi
log_success "Found Python $PY_VERSION ($PYTHON_BIN)."

VENV_DIR="$SCRIPT_DIR/backend/.venv"
if [ ! -d "$VENV_DIR" ]; then
  log_info "Creating Python virtual environment in 'backend/.venv'..."
  "$PYTHON_BIN" -m venv "$VENV_DIR"
  log_success "Virtual environment created."
else
  log_info "Virtual environment already exists in 'backend/.venv'."
fi

log_info "Installing backend dependencies from backend/requirements.txt..."
"$VENV_DIR/bin/pip" install --upgrade pip --quiet
"$VENV_DIR/bin/pip" install -r "$SCRIPT_DIR/backend/requirements.txt" --quiet
log_success "Backend dependencies successfully installed."

# ------------------------------------------------------------------------------
# 5. Bootstrap Storage & Initialize Sample Git Workspace
# ------------------------------------------------------------------------------
log_step "5. Setting up Workspace Storage & Git Repository"

WORKSPACES_DIR="$SCRIPT_DIR/backend/latex_workspaces"
mkdir -p "$WORKSPACES_DIR"
log_success "Workspace storage directory verified: $WORKSPACES_DIR"

# Ensure at least one starter project exists
STARTER_DIR="$WORKSPACES_DIR/quantum-thesis"
if [ ! -d "$STARTER_DIR" ]; then
  log_info "Creating default starter project at 'latex_workspaces/quantum-thesis'..."
  mkdir -p "$STARTER_DIR"

  cat << 'EOF' > "$STARTER_DIR/thesis.tex"
\documentclass[12pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage{amsmath,amssymb}
\usepackage{graphicx}
\usepackage{hyperref}

\title{\textbf{Topological Quantum Computing:\\Fault-Tolerant Architectures and Anyonic Braiding}}
\author{Research Laboratory of Quantum Informatics\\Aegis Research Team}
\date{\today}

\begin{document}
\maketitle

\begin{abstract}
Topological quantum computation represents a robust approach to quantum information processing, protecting qubits from local environmental decoherence through topological invariants. In this document, we explore foundational principles of anyonic statistics and describe experimental architectures for fault-tolerant gates.
\end{abstract}

\section{Introduction}
Non-Abelian anyons in fractional quantum Hall states provide a natural hardware layer for quantum error protection. Rather than relying on continuous active error syndrome measurements, information is encoded non-locally.

\section{Anyonic Statistics and Braiding}
The adiabatic exchange of non-Abelian quasiparticles induces unitary transformations in the degenerate ground state space:
\begin{equation}
\psi_{f} = B(\sigma_i) \psi_i
\end{equation}
where $B(\sigma_i)$ represents the braid generator fulfilling the Yang-Baxter relation.

\section{Conclusion}
Fault-tolerant quantum architectures driven by topological phases offer exciting pathways toward scalable quantum processors.

\bibliographystyle{plain}
\bibliography{references}

\end{document}
EOF

  cat << 'EOF' > "$STARTER_DIR/references.bib"
@article{kitaev2003fault,
  title={Fault-tolerant quantum computation by anyons},
  author={Kitaev, A Yu},
  journal={Annals of Physics},
  volume={303},
  number={1},
  pages={2--30},
  year={2003},
  publisher={Elsevier}
}
EOF

  cat << 'EOF' > "$STARTER_DIR/notes.md"
# Research Notes: Topological Quantum Computing
- [x] Initial manuscript outline
- [ ] Add numerical simulations for braiding error bounds
- [ ] Connect with experimental laboratory dataset
EOF
fi

# Ensure the starter project has its own local Git repository initialized
if [ ! -d "$STARTER_DIR/.git" ]; then
  log_info "Initializing Git repository for '$STARTER_DIR'..."
  cat << 'EOF' > "$STARTER_DIR/.gitignore"
*.aux
*.log
*.out
*.toc
*.bbl
*.blg
*.synctex.gz
*.fls
*.fdb_latexmk
EOF
  (
    cd "$STARTER_DIR"
    git init --quiet
    git add .
    git commit -m "Initial research commit: manuscript and bibliography" --quiet || true
  )
  log_success "Git repository initialized for starter workspace."
else
  log_info "Starter project Git repository already exists."
fi

# ------------------------------------------------------------------------------
# 6. Check Node.js & Install Frontend Dependencies
# ------------------------------------------------------------------------------
log_step "6. Setting up Frontend Environment"

if ! command -v node >/dev/null 2>&1; then
  log_error "Node.js is not found. Please install Node.js 18 or higher."
  exit 1
fi

NODE_VER="$(node --version)"
NODE_MAJOR="$(echo "$NODE_VER" | sed 's/v//' | cut -d. -f1)"

if [ "$NODE_MAJOR" -lt 18 ]; then
  log_error "Node.js $NODE_VER detected. Node.js 18 or higher is required."
  exit 1
fi
log_success "Found Node.js $NODE_VER."

if ! command -v npm >/dev/null 2>&1; then
  log_error "npm is not found."
  exit 1
fi

log_info "Installing frontend npm packages (this may take a moment)..."
npm install --silent
log_success "Frontend packages successfully installed."

# ------------------------------------------------------------------------------
# 7. Check Optional Ollama AI Integration
# ------------------------------------------------------------------------------
log_step "7. Checking Optional Local AI (Ollama)"

if command -v ollama >/dev/null 2>&1; then
  OLLAMA_VER="$(ollama --version 2>/dev/null || echo 'installed')"
  log_success "[Optional] Ollama detected ($OLLAMA_VER)."
  log_info "  Offline AI LaTeX assistance is available."
else
  log_info "[Optional] Ollama is not installed."
  echo "  To enable local AI LaTeX error auto-fixing without an internet connection:"
  echo "    1. Download Ollama from https://ollama.com"
  echo "    2. Pull a coding model: ollama run qwen2.5-coder:1.5b"
fi

# ------------------------------------------------------------------------------
# Complete
# ------------------------------------------------------------------------------
echo ""
echo -e "${GREEN}${BOLD}======================================================================${RESET}"
echo -e "${GREEN}${BOLD}     Aegis Research Fullstack Setup Completed Successfully!          ${RESET}"
echo -e "${GREEN}${BOLD}======================================================================${RESET}"
echo ""
echo "Next step: Start the application fullstack with hot reload by running:"
echo -e "  ${CYAN}${BOLD}./run.sh${RESET}"
echo ""
