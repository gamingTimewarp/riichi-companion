# Android App Implementation Plan

## Goal
Evolve Riichi Companion from a browser-first demo into a production-grade Android app with reliable offline behavior, native integrations, robust testing, release automation, and observability.

---

## 1) Product Definition & Scope

### 1.1 Target outcomes
- Fast, stable Android experience on phones and tablets.
- Full offline functionality for analyzer + tracker core flows.
- Native install/update/distribution through Play Store (and optional direct APK).
- Data safety for long-running games (no accidental state loss).

### 1.2 Feature parity baseline
- Preserve current web capabilities:
  - Hand analyzer
  - Game tracker
  - Rule/config options
  - Local persistence/export
- Identify Android-specific opportunities:
  - File picker/share targets for importing/exporting logs
  - Native haptics and optional notification reminders
  - On-device backup/restore UX

### 1.3 Non-goals (initial release)
- User accounts/cloud sync
- Real-time multiplayer
- iOS release parity in same milestone

---

## 2) Architecture Decision Track

### 2.1 Keep Tauri v2 for Android (recommended)
Given the existing `src-tauri` setup, use Tauri Android packaging as the shortest path.

**Pros**
- Reuses current React UI/business logic.
- Small migration overhead.
- Shared code with web app.

**Risks to manage**
- WebView-specific behavior/performance on lower-end devices.
- Native plugin compatibility constraints.

### 2.2 Decision checkpoint
Before heavy implementation, run a 1-week spike:
- Benchmark cold start and interaction responsiveness on low/mid/high Android devices.
- Validate storage reliability and background/foreground lifecycle behavior.
- Confirm signing + release pipeline works end-to-end.

If spike fails perf/reliability thresholds, evaluate React Native/Kotlin rewrite for later major version.

---

## 3) Milestone Roadmap

## Milestone A — Android Foundation (1–2 weeks)
- Establish Android build flavors:
  - `dev`, `qa`, `prod`
- Configure package IDs, app name variants, icons/splash.
- Harden app lifecycle handling:
  - Resume/background state persistence checks.
- Define minimum SDK / target SDK policy and support matrix.

**Deliverables**
- Installable debug APK from CI.
- Basic smoke-test checklist for manual QA.

## Milestone B — Persistence & Data Integrity (1–2 weeks)
- Introduce explicit persistence versioning and migrations for Zustand stores.
- Add autosave checkpoints around all score-modifying actions.
- Add corruption-safe restore path:
  - Last known good snapshot fallback.
- Improve export/import:
  - User-visible schema version in JSON
  - Validation with clear import errors

**Deliverables**
- Migration test fixtures for old store versions.
- “No data loss on app kill/restart” verification report.

## Milestone C — Native UX & Device Integration (2 weeks)
- Android polish:
  - Haptics for key actions (optional setting)
  - Back-button behavior per screen/modal
  - Keyboard/input ergonomics for tile notation
- File handling:
  - Export to Downloads/share sheet
  - Import from document picker
- Optional local notifications (e.g., unfinished game reminder)

**Deliverables**
- UX acceptance checklist for navigation and file flows.

## Milestone D — Quality & Test Expansion (2–3 weeks)
- Testing pyramid:
  - Unit tests: scoring, round progression, migrations
  - Component tests: critical tracker/analyzer flows
  - E2E smoke on Android emulator (launch, create game, enter hand, export log)
- Regression harness:
  - Golden test vectors for scoring/fu calculations
- Static quality gates:
  - Lint + type checks + test pass required for merges

**Deliverables**
- CI matrix with web + Android smoke.
- Release-blocking quality thresholds documented.

## Milestone E — Security, Privacy, Compliance (1 week)
- Privacy policy and in-app link.
- Data handling declaration for Play Console.
- Keystore/signing hardening:
  - Secrets in CI vault
  - Rotational process documented
- Crash reporting strategy (privacy-preserving) and opt-in telemetry policy.

**Deliverables**
- Play Store compliance checklist complete.

## Milestone F — Release & Operability (1–2 weeks)
- CI/CD for signed AAB/APK artifacts.
- Internal testing track rollout.
- Staged production rollout (5% → 25% → 100%).
- Runbook for hotfix + rollback.

**Deliverables**
- v1 Android release candidate.
- Post-release monitoring dashboard and on-call playbook.

---

## 4) Technical Workstreams

### 4.1 Front-end hardening
- Introduce runtime error boundaries and user-friendly recovery prompts.
- Reduce render churn in high-frequency components.
- Audit accessibility (font scaling, contrast, touch targets).

### 4.2 Domain correctness
- Expand deterministic rule tests for:
  - Draw rules (all tenpai/all noten/dealer branches)
  - Chombo/nagashi edge cases
  - 3-player vs 4-player differences
- Add fixture-driven tests from real game logs.

### 4.3 Performance
- Profile initial render and heavy calculations.
- Memoization/derived-state cleanup where needed.
- Lazy-load non-critical reference content.

### 4.4 Observability
- Capture non-PII crash diagnostics.
- Instrument key funnel events locally first (optional remote later):
  - New game start
  - Hand confirm
  - Export success/failure

---

## 5) Team & Process Plan

### 5.1 Suggested owners
- **Mobile platform owner**: Android packaging, signing, release pipeline
- **Frontend owner**: UX polish, lifecycle behavior, performance
- **Domain owner**: scoring/rules correctness, fixture reviews
- **QA owner**: regression plan, test matrix, release signoff

### 5.2 Delivery cadence
- 1-week sprints, demo at end of each sprint.
- Go/no-go gate at each milestone based on measurable criteria.

### 5.3 Definition of done for Android v1
- Crash-free sessions target met during staged rollout.
- No critical scoring defects in regression suite.
- Export/import and resume-after-kill scenarios pass.
- Play Store policy checks and release docs complete.

---

## 6) Risks & Mitigations

- **Risk:** WebView performance variance across devices.
  - **Mitigation:** Early device benchmark gate; fallback optimization backlog.

- **Risk:** State corruption from evolving persisted schema.
  - **Mitigation:** Versioned migrations + backup snapshot strategy + migration tests.

- **Risk:** Rule regressions during refactors.
  - **Mitigation:** Golden vectors + fixture-based regression tests + CI gates.

- **Risk:** Release signing mistakes.
  - **Mitigation:** Automated signing pipeline with protected secrets + documented runbook.

---

## 7) First 10 Execution Tickets (Starter Backlog)

1. Android build flavors + package identifiers setup.
2. CI job to produce unsigned debug APK on every PR.
3. Zustand persistence versioning and migration scaffolding.
4. Add import/export schema version + validation errors.
5. Implement global error boundary and recovery UI.
6. Back-button behavior spec + implementation across tracker modals.
7. Add scoring golden test fixtures (JSON-driven).
8. Add Android emulator smoke E2E in CI.
9. Signing pipeline with secure secret management.
10. Play Console internal testing rollout checklist.

---

## 8) Success Metrics
- Crash-free sessions ≥ 99.5% after full rollout.
- p95 cold start under agreed threshold on target mid-tier device.
- Zero P0/P1 scoring bugs post-release month 1.
- Export/import success rate ≥ 99% on tested devices.

