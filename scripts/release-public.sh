#!/usr/bin/env bash
# ==============================================================================
# Aegis Research - Automated Public Release Pipeline
# ==============================================================================
# Guarantees that internal development files (AGENTS.md, task/, docs/internal/,
# GIT_Master.md) are strictly excluded from the public GitHub repository while
# remaining 100% intact on your local machine.
# ==============================================================================

set -eo pipefail

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
CYAN="\033[0;36m"
BOLD="\033[1m"
RESET="\033[0m"

DRY_RUN=false
COMMIT_MSG=""

# Parse flags
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -m|--message)
      COMMIT_MSG="$2"
      shift 2
      ;;
    *)
      ;;
  esac
done

echo -e "${CYAN}${BOLD}"
echo "======================================================================"
echo "          Aegis Research - Public Release Pipeline                    "
echo "======================================================================"
echo -e "${RESET}"

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}${BOLD}[MODE] DRY RUN (No actual git push will occur)${RESET}\n"
fi

# ------------------------------------------------------------------------------
# 1. Quality Verification Gates
# ------------------------------------------------------------------------------
echo -e "${CYAN}${BOLD}==> Step 1: Running Mandatory Verification Gates${RESET}"

echo -n "  • Checking Prettier code style... "
npm run format:check >/dev/null 2>&1 && echo -e "${GREEN}PASS${RESET}" || {
  echo -e "${RED}FAIL${RESET}"
  echo -e "${RED}[ERROR] Code formatting check failed. Run 'npm run format' first.${RESET}"
  exit 1
}

echo -n "  • Building frontend bundle (tsc + vite)... "
npm run build >/dev/null 2>&1 && echo -e "${GREEN}PASS${RESET}" || {
  echo -e "${RED}FAIL${RESET}"
  echo -e "${RED}[ERROR] Frontend build failed. Fix compilation errors first.${RESET}"
  exit 1
}

echo -n "  • Running backend Pytest suite... "
backend/.venv/bin/pytest backend/ >/dev/null 2>&1 && echo -e "${GREEN}PASS${RESET}" || {
  echo -e "${RED}FAIL${RESET}"
  echo -e "${RED}[ERROR] Pytest test suite failed.${RESET}"
  exit 1
}

echo -n "  • Checking backend Ruff formatting... "
backend/.venv/bin/ruff format --check backend/ >/dev/null 2>&1 && echo -e "${GREEN}PASS${RESET}" || {
  echo -e "${RED}FAIL${RESET}"
  echo -e "${RED}[ERROR] Backend code formatting check failed.${RESET}"
  exit 1
}

echo -e "${GREEN}✔ All quality gates passed successfully!${RESET}\n"

# ------------------------------------------------------------------------------
# 2. Check Git Remote
# ------------------------------------------------------------------------------
echo -e "${CYAN}${BOLD}==> Step 2: Validating Git Remote${RESET}"
if ! git remote get-url origin >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] No 'origin' remote configured.${RESET}"
  exit 1
fi
REMOTE_URL=$(git remote get-url origin)
echo -e "  • Remote Target: ${BOLD}${REMOTE_URL}${RESET}\n"

# ------------------------------------------------------------------------------
# 3. Create Clean Release Tree (Excluding Internal Files)
# ------------------------------------------------------------------------------
echo -e "${CYAN}${BOLD}==> Step 3: Generating Clean Public Snapshot${RESET}"

TMP_INDEX=$(mktemp)
export GIT_INDEX_FILE="$TMP_INDEX"

# Read current HEAD
git read-tree HEAD

# Remove internal forbidden paths from the release index
git rm --cached -r -q --ignore-unmatch \
  AGENTS.md \
  task \
  docs/internal \
  GIT_Master.md \
  2>/dev/null || true

CLEAN_TREE=$(git write-tree)
rm -f "$TMP_INDEX"
unset GIT_INDEX_FILE

# Strict Boundary Verification on Clean Tree
LEAKED=$(git ls-tree -r --name-only "$CLEAN_TREE" | grep -E '^(AGENTS\.md|task/|docs/internal/|GIT_Master\.md)' || true)
if [ -n "$LEAKED" ]; then
  echo -e "${RED}[CRITICAL ERROR] Leaked internal files detected in release tree:${RESET}"
  echo "$LEAKED" | sed 's/^/  - /'
  exit 1
fi

echo -e "  • Clean Tree Hash: ${BOLD}${CLEAN_TREE}${RESET}"
echo -e "${GREEN}✔ Confirmed zero internal assets in release snapshot.${RESET}\n"

# ------------------------------------------------------------------------------
# 4. Create Release Commit
# ------------------------------------------------------------------------------
echo -e "${CYAN}${BOLD}==> Step 4: Creating Release Commit${RESET}"

if [ -z "$COMMIT_MSG" ]; then
  VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "0.1.0")
  COMMIT_MSG="release: public distribution v${VERSION} ($(date +'%Y-%m-%d'))"
fi

# Detect remote base commit
PARENT_COMMIT=""
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  PARENT_COMMIT="-p origin/main"
elif git rev-parse --verify HEAD >/dev/null 2>&1; then
  PARENT_COMMIT="-p HEAD"
fi

RELEASE_COMMIT=$(git commit-tree "$CLEAN_TREE" $PARENT_COMMIT -m "$COMMIT_MSG")
echo -e "  • Release Commit: ${BOLD}${RELEASE_COMMIT}${RESET}"
echo -e "  • Message: ${BOLD}${COMMIT_MSG}${RESET}\n"

# ------------------------------------------------------------------------------
# 5. Push to Remote Repository
# ------------------------------------------------------------------------------
echo -e "${CYAN}${BOLD}==> Step 5: Pushing to Public Repository${RESET}"

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}DRY RUN: git push origin ${RELEASE_COMMIT}:refs/heads/main --dry-run${RESET}"
  git push origin "${RELEASE_COMMIT}:refs/heads/main" --dry-run
  echo -e "\n${GREEN}✔ Dry run successful! No changes were pushed.${RESET}"
else
  git push origin "${RELEASE_COMMIT}:refs/heads/main"
  echo -e "\n${GREEN}${BOLD}✔ Successfully released to public GitHub repository!${RESET}"
fi

echo -e "${CYAN}Local internal files (AGENTS.md, task/, docs/internal/) remain safe & intact on your laptop.${RESET}\n"
