# Installation Guide: Aegis Research (Scholarly LaTeX IDE)

This guide provides end-to-end instructions for installing and running **Aegis Research** across macOS, Linux (Ubuntu/Debian, Fedora), and Windows (via WSL2).

---

## 1. System Requirements

| Component | Minimum | Recommended |
|---|---|---|
| **OS** | macOS 12+ / Ubuntu 20.04+ / Fedora 38+ / Windows 10+ (WSL2) | macOS Sonoma/Sequoia or Ubuntu 24.04 LTS |
| **Node.js** | v18.0.0+ | v20.x or v22.x LTS |
| **Python** | 3.10+ | 3.11 or 3.12 |
| **LaTeX** | TeX Live 2022+ / BasicTeX | TeX Live 2024/2025 or MacTeX (includes `pdflatex`, `bibtex`, `synctex`) |
| **RAM** | 4 GB | 8 GB+ (16 GB if running local AI models) |
| **Storage** | 1 GB (BasicTeX) | 6 GB (Full TeX Live + local AI models) |

---

## 2. Quick Automated Installation (Recommended)

Aegis Research includes an automated POSIX setup runner that detects your operating system, validates compilers, provisions dependencies, and bootstraps sample research workspaces.

### Step 1: Clone the Repository
```bash
git clone https://github.com/aditlab-code/AegisResearch.git
cd AegisResearch
```

### Step 2: Run Setup
```bash
chmod +x setup.sh run.sh
./setup.sh
```

`setup.sh` performs the following steps:
1. Detects your OS and package manager (`brew`, `apt-get`, `dnf`, or WSL).
2. Verifies `git` availability.
3. Checks for LaTeX binaries (`pdflatex`, `bibtex`) across standard system paths.
4. Creates a Python virtual environment in `backend/.venv` and installs dependencies from `backend/requirements.txt`.
5. Prepares the storage directory at `backend/latex_workspaces/` with an initialized Git starter project (`quantum-thesis`).
6. Installs Node.js frontend dependencies via `npm install`.
7. Checks for optional local Ollama installation.

### Step 3: Start Fullstack Services
```bash
./run.sh
```

- **IDE Web Interface**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Shutdown**: Press `Ctrl + C` in the terminal to terminate both backend and frontend processes cleanly.
- **Force restart if ports are busy**:
  ```bash
  ./run.sh --force
  ```

---

## 3. Manual Step-by-Step Installation

If you prefer to configure your environment manually or need a customized setup, follow these steps:

### 3.1 Install LaTeX Engine

A local LaTeX distribution providing `pdflatex` and `bibtex` is required for document compilation.

#### macOS (via Homebrew)
- **Lightweight BasicTeX (~100MB)**:
  ```bash
  brew install --cask basictex
  # Add TeX binaries to your PATH (add to ~/.zshrc or ~/.bash_profile):
  export PATH="/Library/TeX/texbin:$PATH"
  ```
- **Full MacTeX (~5GB, includes all fonts and packages)**:
  ```bash
  brew install --cask mactex-no-gui
  ```

#### Debian / Ubuntu / Windows WSL2 (via APT)
```bash
sudo apt-get update
sudo apt-get install -y \
  texlive-latex-base \
  texlive-latex-extra \
  texlive-fonts-recommended \
  texlive-bibtex-extra
```

#### Fedora (via DNF)
```bash
sudo dnf install -y \
  texlive-scheme-medium \
  texlive-bibtex
```

#### Verification
Verify that the binaries are reachable:
```bash
pdflatex --version
bibtex --version
synctex help
```

---

### 3.2 Install System Dependencies

Ensure Git, Python 3.10+, and Node.js 18+ are installed:

#### macOS
```bash
brew install git python node
```

#### Ubuntu / Debian
```bash
sudo apt-get update
sudo apt-get install -y git python3 python3-venv python3-pip nodejs npm
```

---

### 3.3 Setup Backend Environment

1. Navigate to the repository root and create a virtual environment:
   ```bash
   python3 -m venv backend/.venv
   ```

2. Activate the virtual environment:
   - **macOS / Linux**:
     ```bash
     source backend/.venv/bin/activate
     ```
   - **Windows WSL / Git Bash**:
     ```bash
     source backend/.venv/bin/activate
     ```

3. Upgrade pip and install Python packages:
   ```bash
   pip install --upgrade pip
   pip install -r backend/requirements.txt
   ```

4. Create the workspace storage directory:
   ```bash
   mkdir -p backend/latex_workspaces
   ```

---

### 3.4 Setup Frontend Environment

From the project root:
```bash
npm install
```

---

### 3.5 (Optional) Local AI Assistant Setup (Ollama)

Aegis Research supports offline, privacy-first AI assistance (error diagnostic & code remediation) powered by Ollama.

1. **Install Ollama**:
   - macOS / Linux: Follow instructions at [https://ollama.com/download](https://ollama.com/download)
   - Or on macOS via Homebrew:
     ```bash
     brew install --cask ollama
     ```

2. **Pull a Recommended Coding Model**:
   ```bash
   # Lightweight model (~1GB VRAM, suitable for standard laptops):
   ollama pull qwen2.5-coder:1.5b

   # Alternative model:
   ollama pull deepseek-coder:1.3b
   ```

3. Ensure Ollama service is running:
   ```bash
   ollama serve
   ```

---

## 4. Running the Application

### Running Concurrently
```bash
./run.sh
```

### Running Components Individually

#### Terminal 1 — Backend (FastAPI)
```bash
backend/.venv/bin/python -m backend.main
```
The backend will start at `http://0.0.0.0:8000` with hot-reload enabled.

#### Terminal 2 — Frontend (Vite)
```bash
npm run dev:frontend
```
The frontend will start at `http://localhost:5173`.

---

## 5. Troubleshooting & FAQ

### Issue 1: `pdflatex: command not found` or compilation fails with "Compiler binary not found"
**Cause**: The TeX distribution binary path is not in your shell's `PATH`.  
**Solution**:
- On macOS, TeX binaries are installed in `/Library/TeX/texbin` or `/usr/local/texlive/<year>/bin/universal-darwin`.
- Add the following to your `~/.zshrc` or `~/.bashrc`:
  ```bash
  export PATH="/Library/TeX/texbin:$PATH"
  ```
- Reload your terminal:
  ```bash
  source ~/.zshrc
  ```

### Issue 2: Port Collision (`[Errno 48] Address already in use`)
**Cause**: Another process or previous session is occupying port `8000` (FastAPI) or `5173` (Vite).  
**Solution**:
Run the runner with the force restart flag:
```bash
./run.sh --force
```
Or manually terminate the processes:
```bash
kill -9 $(lsof -ti :8000 -ti :5173)
```

### Issue 3: Permission Denied when running scripts
**Cause**: Shell scripts do not have execution permissions.  
**Solution**:
```bash
chmod +x setup.sh run.sh
```

### Issue 4: Python virtual environment errors on Ubuntu
**Cause**: `python3-venv` package is missing.  
**Solution**:
```bash
sudo apt-get install -y python3-venv python3-full
```

### Issue 5: Missing LaTeX packages during document compile
**Cause**: If using BasicTeX, specific LaTeX packages (like `microtype`, `cite`, or fonts) might need installation.  
**Solution**:
Install packages using TeX Live Manager (`tlmgr`):
```bash
sudo tlmgr update --self
sudo tlmgr install collection-latexextra collection-fontsrecommended
```

### Issue 6: SyncTeX Inverse / Forward Search not responding or returning 404
**Cause**: The project has not been compiled yet, or the compile failed before generating the SyncTeX mapping file (`.synctex.gz`).  
**Solution**:
1. Click **Compile** (or press `Cmd/Ctrl + S` to save and compile).
2. Verify that the compilation completed successfully with status `Compiled successfully`.
3. Check that `<project_name>.synctex.gz` is present inside `backend/latex_workspaces/<project_name>/`.
4. Ensure `synctex` is installed and available in your system `PATH` by running `which synctex`.

