# Riichi Companion

A mobile-first Progressive Web App for Riichi Mahjong players. Installable from the browser, works offline, no account required.

**→ [Full User Guide](docs/USER_GUIDE.md)**

---

## Features

### Hand Analyzer
- Build hands with a visual tile picker or text notation (`123m456p789s11z`)
- Declare open melds (chi, pon, kan)
- Shanten count and tenpai wait display with remaining tile count and wait type (ryanmen, kanchan, etc.)
- Score calculation: han, fu, total points, fu breakdown
- Yaku list including yakuman and double yakuman
- Win options: tsumo/ron, riichi, double riichi, ippatsu, last tile, after kan, seat/round wind, dora indicators
- **Furiten detection** — flags waits that appear in your own discards; blocks invalid ron scores
- **Discard tracker** — per-player discard piles with furiten badges and Nagashi Mangan eligibility
- **Learning mode** — hides waits until you tap to reveal

### Game Tracker
- 3-player (Sanma) and 4-player (Yonma) support
- Hanchan and Tonpuusen game types
- Dealer selection via dice roller; wall-break dice roller
- Detailed (han + fu) and Quick (point total) hand entry modes, switchable mid-game
- Riichi and double riichi tracking with pool management
- Draw settlement with EMA tenpai payment rules
- Chombo, Nagashi Mangan
- Bust detection
- Snapshot-based undo for the most recent hand
- End-of-game screen: final scores, placement, uma, score history chart
- JSON export of the full game log

---

## Ruleset

EMA (European Mahjong Association):
- Open tanyao (kuitan) allowed
- Starting score 30,000 (35,000 for Sanma); return 30,000 / 35,000 (no oka)
- Uma: +15,000 / +5,000 / −5,000 / −15,000 (Sanma: +15,000 / 0 / −15,000)

---

## Running Locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

Requires Node 18+.

---

## Stack

- [Vite](https://vite.dev/) + React
- [Tailwind CSS v4](https://tailwindcss.com/)
- [riichi-ts](https://www.npmjs.com/package/riichi-ts) — shanten, waits, yaku, scoring
- [Zustand](https://zustand-demo.pmnd.rs/) — state management with localStorage persistence
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — service worker + web manifest
