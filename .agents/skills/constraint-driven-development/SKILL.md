---
name: constraint-driven-development
description: Establishes a project's quality bar as a written contract and stops agents quietly lowering it. Records everything in CONSTRAINTS.md, and watches the diff for a weakened bar. Use when no quality bar is written down, when the user says "set up constraints" or "define our standards", or to enforce strict non-negotiables replacing legacy bible systems.
---

# Constraint-Driven Development

## Overview

Establish the project's quality bar as an explicit written contract recorded in `CONSTRAINTS.md`. This skill replaces static, hardcoded bible stores by allowing dynamic, project-specific constraints that are mechanically enforceable across all coding workflows.

Spec-driven development says what to build. Test-driven development proves it works. Constraint-driven development defines what "good enough to ship" means before anyone argues about it.

## When to Use

- Defining project standards, quality bars, and non-negotiable boundaries
- When replacing legacy bible files with dynamic, versioned rules
- Enforcing zero-orphan, strict test gates, and token efficiency limits
- Preventing agents from stripping assertions, skipping tests, or silencing linters

## The Constraints Contract (`CONSTRAINTS.md`)

Record project constraints covering these key areas:

### 1. The Quality Floor (Non-Negotiables)
- **Zero-Orphan Policy**: No dead code or orphaned symbols permitted (`codegraph_find_orphans`).
- **Tests Are Proof**: No assertions deleted or tests disabled (`skip`, `@pytest.mark.skip`, `it.skip`) to make builds pass.
- **Strict Stop-Gate**: 100% green exit code required on automated tests before completion.
- **Language & Communication**: Internal English reasoning; output/comments/commits in clean, formal language without raw chain-of-thought dumps.

### 2. Architecture & Boundaries
- Database files (`data/aegis.db`, `.aegis/`) are strictly protected from accidental deletion or corrupted writes.
- Git branching isolation (`master`, `main`, `release`) and clean directory boundaries.
- RTK protocol priority (`rtk rg`, `rtk find`, `rtk read`, `rtk test`).

### 3. Sane Defaults & Thresholds
- Token budget limits (< 4,000 token split-brain budget).
- Maximum diff size per commit / slice (< 100 lines per atomic increment).

## Verification
- [ ] Quality floor established without hidden suppressions
- [ ] Constraints written to `CONSTRAINTS.md` and committed
- [ ] All future edits verified against the contract
