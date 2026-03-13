# 1.2 Release Checklist

Use this checklist before creating the `v1.2.x` tag.

## 1) Local validation
- Run `npm ci`
- Run `npm run lint`
- Run `npm test`
- Run `npm run build`

## 2) Version alignment
- Confirm `package.json` and `src-tauri/tauri.conf.json` have the same version.
- If you plan to release `v1.2.x`, ensure both files are exactly `1.2.x`.

## 3) CI validation
- Ensure `CI` workflow is green on the release branch/PR.
- Ensure `Android Emulator Smoke` workflow is green.
- Optionally run `Pre-release Checklist` workflow with input tag `v1.2.x`.

## 4) Release workflow expectations
- Pushing `v1.2.x` should trigger the `Release` workflow.
- `preflight` validates tag/version consistency.
- Linux build runs AppImage smoke test and uploads smoke logs.
- Release artifacts include checksums (`SHA256SUMS.txt`) and APK signature output.

## 5) Post-tag verification
- Confirm GitHub Release is created.
- Confirm assets are attached for Linux, Windows, and Android.
- Spot-check checksums and APK signature report.
