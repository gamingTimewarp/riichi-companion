# 1.3 Release Checklist

Use this checklist before creating the `v1.3.x` tag.

## 1) Local validation
- Run `npm ci`
- Run `npm run lint`
- Run `npm test`
- Run `npm run build`

## 2) Version alignment
- Confirm `package.json` and `src-tauri/tauri.conf.json` have the same version.
- If you plan to release `v1.3.x`, ensure both files are exactly `1.3.x`.

## 3) CI validation
- Ensure `CI` workflow is green on the release branch/PR.
- Ensure `Android Emulator Smoke` workflow is green.
- Optionally run `Pre-release Checklist` workflow with input tag `v1.3.x`.

## 4) Release workflow expectations
- Pushing `v1.3.x` should trigger the `Release` workflow.
- `preflight` validates tag/version consistency.
- Linux build runs AppImage smoke test and uploads smoke logs.
- Release artifacts include checksums (`SHA256SUMS.txt`) and APK signature output.

## 5) Post-tag verification
- Confirm GitHub Release is created.
- Confirm assets are attached for Linux, Windows, and Android.
- Spot-check checksums and APK signature report.


## 6) AppImage crash diagnostics
- Linux smoke test now forces software rendering (`WEBKIT_DISABLE_COMPOSITING_MODE=1`, `WEBKIT_DISABLE_DMABUF_RENDERER=1`, `LIBGL_ALWAYS_SOFTWARE=1`, `GDK_BACKEND=x11`) to avoid GPU/DMABUF crashes in CI.
- On smoke-test failure, check uploaded artifact `linux-smoke-logs` for:
  - `appimage-smoke.log`
  - `appimage-crash-context.log` (includes recent `coredumpctl` + `journalctl` output when available).
- For local reproduction, run:
  - `APPIMAGE_EXTRACT_AND_RUN=1 WEBKIT_DISABLE_COMPOSITING_MODE=1 WEBKIT_DISABLE_DMABUF_RENDERER=1 LIBGL_ALWAYS_SOFTWARE=1 GDK_BACKEND=x11 ./Riichi.Companion_1.3.1_amd64.AppImage`
  - `coredumpctl info --no-pager | head -n 200`
  - `journalctl --user -b --no-pager | tail -n 200`


## 7) Hardening sprint handoff
- Use `docs/HARDENING_TEST_DEBUG_PLAN.md` as the baseline testing/debugging playbook after tagging `v1.3.1`.
- Track blocker/high-severity defects from smoke + support-bundle triage before promoting the next patch release.
