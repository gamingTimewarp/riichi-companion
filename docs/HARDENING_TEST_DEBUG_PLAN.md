# v1.3.1 Hardening Testing & Debugging Plan

This plan starts immediately after cutting `v1.3.1` and focuses on reliability validation, crash triage, and release confidence.

## 1) Goals

- Reduce crash and data-loss risk before broader rollout.
- Reproduce and isolate AppImage/WebKit and Android-specific runtime issues.
- Verify rules/scoring correctness under extended scenario matrices.
- Produce a clear go/no-go signal for `v1.3.2+` follow-ups.

## 2) Scope

### In scope
- Regression testing (rules, scoring, tracker flows, migrations).
- Platform smoke deepening (Linux AppImage, Android emulator/device).
- Crash/support-bundle triage workflow.
- Manual exploratory testing for top user flows.

### Out of scope
- New feature implementation unless required for blocker fixes.
- Major architecture changes.

## 3) Test matrix

### 3.1 Automated checks (every PR)
- `npm run lint`
- `npm test`
- `npm run build`
- `Pre-release Checklist` workflow (manual trigger before release tags)
- `Android Emulator Smoke` workflow (install + launch verification)

### 3.2 Scenario suites (targeted)
1. **Rules/Profile**
   - Preset switching (`ema`, `wrc`, `mleague`) for 3p/4p.
   - Preset lock + import/export round-trip.
   - Advanced setup overrides with back-navigation close behavior.
2. **Scoring policy**
   - Kiriage/kazoe permutations, sanma/yonma, tsumo/ron, dealer/non-dealer.
   - Fixed-pool vs fixed-noten draw modes.
3. **Persistence/migration**
   - Cold start with empty storage.
   - Restore from prior persisted schemas.
   - Crash recovery with support bundle export.
4. **Release artifacts**
   - Linux AppImage smoke (software-rendering env path).
   - Android APK install/launch on emulator + one physical device spot check.

## 4) Debugging workflow

### 4.1 Crash intake
- Collect exported support bundle JSON from user/crash screen.
- For AppImage failures, attach:
  - `linux-smoke-logs/appimage-smoke.log`
  - `linux-smoke-logs/appimage-crash-context.log`
  - local `coredumpctl`/`journalctl` excerpts when available.

### 4.2 Triage template
For each issue:
- Environment (OS, app version, package type).
- Repro steps + expected vs actual.
- Bundle/log excerpts.
- Severity (blocker/high/medium/low).
- Owner + target fix version.

### 4.3 Fix validation criteria
- Repro no longer occurs in affected environment.
- Relevant automated tests added or updated.
- No regressions in scoring fixtures and migration tests.

## 5) Manual exploratory checklist

- Start/complete full game in 4p and 3p.
- Use advanced setup overrides and verify they do not persist unintentionally.
- Validate crash boundary actions (show/hide/clear/download bundle).
- Verify settings import/export and privacy-policy access path.
- Confirm Android back behavior in setup advanced panel.

## 6) Exit criteria for hardening sprint

- No open blocker issues.
- No unresolved high-severity data-loss or scoring defects.
- CI + smoke workflows green for release candidate commit.
- At least one successful AppImage run and Android launch verification on latest candidate.

## 7) Deliverables

- Prioritized bug board with owners and status.
- Daily defect burn-down summary.
- Release recommendation note (`go` / `no-go`) with known risks.
