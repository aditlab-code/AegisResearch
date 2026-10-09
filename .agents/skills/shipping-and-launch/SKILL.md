---
name: shipping-and-launch
description: Prepares production launches. Use when preparing to deploy to production, or when asking what needs to be in place before shipping. Use when you need a pre-launch checklist, when setting up monitoring, when planning a staged rollout, or when you need a rollback strategy.
---

# Shipping and Launch

## Overview

Ship with confidence. The goal is not just to deploy — it's to deploy safely, with monitoring in place, a rollback plan ready, and a clear understanding of what success looks like. Every launch should be reversible, observable, and incremental.

## When to Use

- Deploying a feature to production for the first time
- Releasing a significant change to users
- Migrating data or infrastructure
- Any deployment that carries risk (faster is safer when verified)

## Parallel Fan-Out Execution
Upon invoking `/ship`, the orchestrator (`zeus-orchestrator`) executes a parallel fan-out merge:
1. Runs `heracles-tester` (or `test-engineer`) to verify full test suite passes 100% green.
2. Runs `themis-reviewer` (or `code-reviewer`) to evaluate 5-axis quality and zero-orphan compliance.
3. Runs `security-auditor` to verify no secret leaks or vulnerable dependencies.
4. Synthesizes findings into a single Go/No-Go Release Report.

## Pre-Launch Checklist

### Code & Test Proof
- [ ] All unit, integration, and regression tests pass (exit code 0).
- [ ] Zero orphan code verified via `codegraph_find_orphans`.
- [ ] Build succeeds with zero critical errors.

### Security & Compliance
- [ ] No hardcoded secrets, tokens, or credentials in VCS.
- [ ] Input validation verified on public interfaces.
- [ ] Sensitive database and configuration files protected.

### Reversibility
- [ ] Rollback strategy defined and documented.
- [ ] Database migrations are backwards-compatible.

## Final Release Gate
```markdown
### Live Ship Gate Report
- Verification Status: [READY TO SHIP | BLOCKED]
- QA Verification: [PASS (100% Green)]
- Review Verdict: [APPROVED]
- Security Status: [CLEAN]
- Rollback Plan: [Documented]
```
