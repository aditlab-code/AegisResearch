# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Cursor, Copilot, Antigravity, etc.) when working with code in this repository.

> **Scope:** This file configures AI coding agents working on the **AegisCode** repository (`apps/frontend/`, `apps/django_app/`, `src/agent_ai/`).
> All label and code function use english prefix
> Runner Python 'backend/.venv'

## Rust Token Killer (`rtk`) Integration Guidelines

enforces the use of **RTK (Rust Token Killer)** — a high-performance CLI proxy located at `~/.local/bin/rtk` designed to filter, condense, and summarize command line outputs before they enter the LLM context window.

### 1. Mandatory Command Prefixing
- **Always Prefix Shell Invocations**: All coding agents MUST prefix shell commands with `rtk`:
  - `rtk git status`, `rtk git diff`, `rtk git log -n 5`
  - `rtk npm --prefix apps/frontend run build`, `rtk npm test`
  - `rtk node --test apps/frontend/tests/*.test.mjs`
  - `rtk ls -la apps/frontend/src/styles/`
  - `rtk cargo test`, `rtk pytest`
- **Safe Passthrough**: If `rtk` does not have a dedicated filter for a given tool, it safely runs the command unmodified without altering behavior or exit code.
- **Strict Chaining Rule**: In compound shell commands, prefix EVERY segment in the chain:
  - Correct: `rtk git add . && rtk git commit -m "feat: update"`
  - Incorrect: `rtk git add . && git commit -m "feat: update"`

### 2. Output Handling & Failure Recovery Protocol
- **Signal Retention**: RTK condenses verbosity while preserving errors, warnings, and stack traces. Treat its output as authoritative and complete.
- **Fallback (`rtk proxy`)**: If a filtered command returns an unusable result (e.g. unexpectedly empty output, garbled response, or mismatch with exit code), re-run explicitly with proxy mode:
  ```bash
  rtk proxy <command>
  ```
- **Temporary Bypass**: To execute a raw command completely bypassing RTK:
  ```bash
  RTK_DISABLED=1 <command>
  ```
- **Unix Piping**: For commands consuming output through pipes:
  ```bash
  <command> | rtk pipe
  ```

### 3. Token Economics & Monitoring
- Check cumulative token savings across sessions:
  - `rtk gain` — summary of total tokens saved.
  - `rtk gain --history` — detailed breakdown per command.
  - `rtk discover` — analyze past terminal runs for missed compression opportunities.

## Repository Overview

AegisCode is an AI-assisted engineering workbench combining AegisCode Studio (Vue 3 + Vite IDE) and Aegis Agent (autonomous runtime engine). Skills in `.agents/skills/` and `skills/` extend agent capabilities.

## OpenCode Integration

OpenCode uses a **skill-driven execution model** powered by the `skill` tool and this repository's `/skills` directory.

### Core Rules

- If a task matches a skill, you MUST invoke it
- Skills are located in `skills/<skill-name>/SKILL.md`
- Never implement directly if a skill applies
- Always follow the skill instructions exactly (do not partially apply them)

### Intent → Skill Mapping

The agent should automatically map user intent to skills:

- Feature / new functionality → `spec-driven-development`, then `incremental-implementation`, `test-driven-development`
- Planning / breakdown → `planning-and-task-breakdown`
- Bug / failure / unexpected behavior → `debugging-and-error-recovery`
- Code review → `code-review-and-quality`
- Refactoring / simplification → `code-simplification`
- API or interface design → `api-and-interface-design`
- UI work → `frontend-ui-engineering`

### Lifecycle Mapping (Implicit Commands)

OpenCode does not support slash commands like `/spec` or `/plan`.

Instead, the agent must internally follow this lifecycle:

- DEFINE → `spec-driven-development`
- PLAN → `planning-and-task-breakdown`
- BUILD → `incremental-implementation` + `test-driven-development`
- VERIFY → `debugging-and-error-recovery`
- REVIEW → `code-review-and-quality`
- SHIP → `shipping-and-launch`

### Execution Model

For every request:

1. Determine if any skill applies (even 1% chance)
2. Invoke the appropriate skill using the `skill` tool
3. Follow the skill workflow strictly
4. Only proceed to implementation after required steps (spec, plan, etc.) are complete

### Anti-Rationalization

The following thoughts are incorrect and must be ignored:

- "This is too small for a skill"
- "I can just quickly implement this"
- "I’ll gather context first"

Correct behavior:

- Always check for and use skills first

This ensures OpenCode behaves similarly to Claude Code with full workflow enforcement.

## Frontend UI Engineering & Styling Guidelines (`apps/frontend`)

When working on any frontend code in `apps/frontend/`, agents MUST adhere strictly to the following architectural constraints and quality gates:

### 1. Component Architecture & Coordinator Pattern
- **Thin Layout Coordinator**: `WorkbenchView.vue` (< 450 lines) is strictly a coordinator. It connects splitters, shortcuts, and root events, delegating state and logic to composable facades (`useWorkbenchEditorFacade.js`, `useWorkbenchAssistantFacade.js`, `useWorkbenchDockFacade.js`, `useWorkbenchLayout.js`).
- **Presentational Component Decoupling**: Keep UI components focused and modular (e.g., `EditorTabBar.vue`, `EditorBreadcrumbs.vue`, `EditorConfirmCloseModal.vue`).
- **Async DOM Guard for Monaco**: Wrap all Monaco `layout()` calls in `requestAnimationFrame` guards to prevent crashes during rapid splitter dragging or tab switches.

### 2. Unified Theming & CSS Token Constraints (Strict Non-Negotiables)
- **Single Source of Truth (`theme-presets.css`)**:
  - All color tokens are defined exclusively in `apps/frontend/src/styles/themes/theme-presets.css` across 10 curated presets (6 dark, 4 light).
  - Colors MUST be specified as pure HEX: `#RRGGBB` or `#RRGGBBAA`.
  - ZERO nested CSS color functions (`rgba()`, `color-mix()`, `hsl()`) in `theme-presets.css`.
- **Zero Hardcoded HEX**:
  - No hex codes (`#hex`) are allowed in any CSS file outside `theme-presets.css`.
  - No hex codes (`#hex`) are allowed inside `.vue` files.
- **Zero Token Overrides in Vue**:
  - Do NOT write `[data-theme="light"]` or `:global([data-theme="light"])` selectors inside `<style>` blocks in `.vue` components.
  - All light theme structural and contrast rules MUST be placed in `apps/frontend/src/styles/themes/theme-light.css`.
- **Zero Inline Color Styles**:
  - Do NOT write inline `:style="{ color: ... }"` or `:style="{ backgroundColor: ... }"` in `.vue` templates.
  - Use semantic data attributes (e.g., `:data-file-type="fileTypeIcon(tab.name)"`) and define their colors in reusable stylesheets (e.g., `apps/frontend/src/styles/components/explorer.css`).
- **Dynamic Theme Reactivity**:
  - Monaco Editor and xterm.js terminal themes synchronize reactively with `document.documentElement` attributes (`data-theme`, `data-theme-preset`) via `themeService.js` and DOM MutationObservers (`attributeFilter: ["data-theme", "data-theme-preset"]`).

### 3. Mandatory Frontend Verification Gates
Before completing any task touching `apps/frontend/`, the agent MUST run and pass these verification checks:
1. `rtk grep -rn "data-theme" apps/frontend/src/ | grep "\.vue"` -> Must ONLY match `<script>` attribute watchers (0 in `<style>` blocks).
2. `rtk grep -rn ':style=".*color' apps/frontend/src/ | grep "\.vue"` -> Must return 0 matches.
3. `rtk grep -rn "#[0-9a-fA-F]\{3,8\}" apps/frontend/src/styles/ | grep -v "theme-presets.css"` -> Must return 0 matches.
4. `rtk grep -rn "#[0-9a-fA-F]\{3,8\}" apps/frontend/src/ | grep "\.vue"` -> Must return 0 matches.
5. `rtk npm --prefix apps/frontend run build` -> Must pass with 0 errors.
6. `rtk node --test apps/frontend/tests/*.test.mjs` -> Must pass 100% of tests.


## Orchestration: Personas, Skills, and Commands

This repo has three composable layers. They have different jobs and should not be confused:

- **Skills** (`skills/<name>/SKILL.md`) — workflows with steps and exit criteria. The *how*. Mandatory hops when an intent matches.
- **Personas** (`agents/<role>.md`) — roles with a perspective and an output format. The *who*.
- **Slash commands** (`.claude/commands/*.md`) — user-facing entry points. The *when*. The orchestration layer.

Skills in this repo are markdown-first: each lives at `skills/<kebab-case-name>/SKILL.md` with YAML frontmatter (`name`, `description`) and follows the section anatomy (Overview, When to Use, Process, Common Rationalizations, Red Flags, Verification). Add a `scripts/` directory only when the skill ships runnable helpers; most skills are markdown only, and there are no per-skill zip packages.

For the full format, naming conventions, frontmatter rules, supporting-file thresholds, and writing principles, see [docs/skill-anatomy.md](docs/skill-anatomy.md), the single source of truth for skill structure. Do not restate that guidance here, link to it.
