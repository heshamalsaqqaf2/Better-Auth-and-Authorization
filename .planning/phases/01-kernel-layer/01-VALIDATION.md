---
phase: 1
slug: kernel-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — tests deferred per PROJECT.md |
| **Config file** | tsconfig.json |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit`
- **Before verification:** Must pass with zero type errors

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | PRIM-01 | compile-time | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | PRIM-02 | compile-time | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | PRIM-03 | compile-time | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | PRIM-04 | compile-time | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | PRIM-05 | compile-time | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-06 | 01 | 1 | CONT-01 | compile-time | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-07 | 01 | 1 | CONT-02 | compile-time | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-08 | 01 | 1 | CONT-03 | compile-time | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-09 | 01 | 1 | CONT-04 | compile-time | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-10 | 01 | 1 | CONT-05 | compile-time | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-11 | 01 | 1 | CNST-01 | compile-time | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-12 | 01 | 1 | CNST-02 | compile-time | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-13 | 01 | 1 | API-01 | compile-time | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-14 | 01 | 1 | API-02 | compile-time | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `tsconfig.json` — target upgraded from ES2017 to ES2022

---

## Manual-Only Verifications

All phase behaviors have automated verification via `npx tsc --noEmit`.

---

## Validation Sign-Off

- [ ] All tasks have compile-time verify via `npx tsc --noEmit`
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
