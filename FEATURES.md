# Feature Backlog

## Existing Features — Improvements

- [x] **Multi-step undo** — undo currently only reverts one hand. Per-hand snapshots already exist in the game log, so undo-to-any-hand would be a small addition.
- [x] **Quick Mode point list is static** — dropdown options don't scale with active rules (e.g. kiriage mangan shifts thresholds). Options should be generated dynamically.
- [x] **Hand log labels are minimal** — log shows generic entries. Should show winner name + yaku (at minimum "Tsumo" or "Ron from X") for readability.
- [x] **Discard tracker state doesn't persist across sessions** — hand/discard store is session-only. Discards are lost if the user navigates away.
- [x] **No dora indicator input in the analyzer** — no way to input a dora indicator tile and have the system auto-count matching tiles as dora. Dora count must be set manually.
- [x] **Learning mode confirm flow is unimplemented** — `learningConfirmFlow` toggle exists in the store but is never rendered in any UI.
- [x] **Oka field has no auto-calculate helper** — oka is derived from the gap between start score and return points, but the UI accepts any arbitrary number with no guidance.

## Missing Features

- [x] **Score history / career stats** — no record of past completed games. Game log exports to JSON but there's no in-app browser for past games.
- [x] **Multiple ron in hand entry** — rules support "allow multiple ron" but hand entry only accepts one winner.
- [x] **Sanma-specific scoring** — unclear whether the scoring engine handles 3-player distinctions (e.g. no man tiles, different base point calculations) or just runs the same logic with 3 players.
- [x] **Chombo during tenpai draw** — false tenpai declaration is a distinct chombo case; the current chombo sheet is generic and doesn't distinguish.
- [x] **Furiten warning in the tracker** — the analyzer has furiten detection but the tracker has no way to flag a likely-invalid ron call.

## New Features

- [x] **Score projection / bubble check** — show each player's projected final placement score at any point based on current scores + uma. Useful in the final rounds.
- [x] **Tenpai tile counter** — live count of tiles remaining that complete the hand, using discard tracker data to subtract visible tiles from the pool.
- [x] **Yaku difficulty filter in Reference** — beginner / intermediate / advanced filter, han filter, open/closed filter, unofficial/house rule toggle (hidden by default), example hands per yaku.
- [x] **Share / export game summary** — at end of game, generate shareable formatted text (or QR code) so players can share results without the raw JSON.
- [x] **Hand history browser** — searchable/filterable log of all recorded hands across sessions (depends on past-game persistence).
- [x] **Practice mode** — show a random tenpai hand and ask the user to identify the waits before revealing. Builds on existing learning mode infrastructure.
- [x] **Tile wall visualization** — full 136-tile wall with drawn tiles marked, for teaching or tracking remaining wall tiles.
