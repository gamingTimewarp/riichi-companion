# Riichi Companion — User Guide

Riichi Companion is a mobile-first Progressive Web App (PWA) for Riichi Mahjong players. It provides two main tools: a **Hand Analyzer** for studying tenpai shapes, waits, and scoring, and a **Game Tracker** for recording live game scores.

The app follows **EMA (European Mahjong Association)** rules: open tanyao (kuitan) is allowed, starting scores are 30,000 (35,000 for 3-player), and uma is +15,000/+5,000/−5,000/−15,000.

---

## Table of Contents

1. [Installation & Setup](#installation--setup)
   - [Linux](#linux)
   - [Windows](#windows)
   - [Android](#android)
   - [PWA](#pwa-any-platform)
   - [Local Development](#local-development)
2. [Hand Analyzer](#hand-analyzer)
   - [Building a Hand](#building-a-hand)
   - [Open Melds](#open-melds)
   - [Win Options](#win-options)
   - [Dora & Uradora Indicators](#dora--uradora-indicators)
   - [Analysis Results](#analysis-results)
   - [Furiten Detection](#furiten-detection)
   - [Discard Tracker](#discard-tracker)
   - [Learning Mode](#learning-mode)
3. [Game Tracker](#game-tracker)
   - [Game Setup](#game-setup)
   - [Dealer Selection (Dice Roller)](#dealer-selection-dice-roller)
   - [Game Screen](#game-screen)
   - [Recording a Win](#recording-a-win)
   - [Recording a Draw](#recording-a-draw)
   - [Chombo](#chombo)
   - [Nagashi Mangan](#nagashi-mangan)
   - [Wall Dice](#wall-dice)
   - [Riichi & Double Riichi](#riichi--double-riichi)
   - [Bust Detection](#bust-detection)
   - [Undo](#undo)
   - [End of Game](#end-of-game)
4. [3-Player (Sanma) Mode](#3-player-sanma-mode)
5. [Tile Notation Reference](#tile-notation-reference)

---

## Installation & Setup

Download the latest release from the [Releases page](https://github.com/gamingTimewarp/riichi-companion/releases). Each release includes packages for all supported platforms.

---

### Linux

Two formats are provided. Use whichever matches your distribution.

**RPM (Fedora, openSUSE, RHEL, etc.)**
```bash
sudo dnf install "Riichi Companion-1.0.0-1.x86_64.rpm"
```

**DEB (Ubuntu, Debian, Mint, etc.)**
```bash
sudo apt install "./Riichi Companion_1.0.0_amd64.deb"
```

**AppImage (any distribution)**

AppImage runs without installation. Download the `.AppImage` file, make it executable, and run it:
```bash
chmod +x "Riichi Companion_1.0.0_amd64.AppImage"
./"Riichi Companion_1.0.0_amd64.AppImage"
```

> **Note for Fedora/SELinux users:** If the AppImage fails to launch, set `APPIMAGE_EXTRACT_AND_RUN=1` in your environment (add it to `~/.bashrc`) and try again.

---

### Windows

Download and run the `.exe` installer (`Riichi Companion_1.0.0_x64-setup.exe`). Follow the installer prompts — the app will appear in your Start Menu after installation.

An `.msi` package is also available for managed/enterprise deployments.

---

### Android

Download the `.apk` file and open it on your Android device. You may need to allow installation from unknown sources:

1. Transfer the APK to your device (or download directly in a browser).
2. Open the APK file.
3. If prompted, go to **Settings → Install unknown apps** and allow your browser or file manager to install APKs.
4. Tap **Install**.

The app will appear in your launcher as **Riichi Companion**.

> The APK is unsigned (sideload only). A Play Store release may follow in a future version.

---

### PWA (any platform)

Riichi Companion can also be installed as a Progressive Web App directly from the browser — no app store or package required:

1. Open the app URL in a browser (Chrome on Android/desktop, Safari on iOS).
2. Use the browser's **Add to Home Screen** or **Install app** option.
3. The app opens in standalone mode and works offline.

---

### Local Development

```bash
npm install
npm run dev      # development server at http://localhost:5173
npm run build    # production build → dist/
```

---

## Hand Analyzer

The Hand Analyzer helps you check shanten count, identify tenpai waits, calculate scores, and explore furiten.

### Building a Hand

There are two ways to enter tiles:

**Tile Picker (default)**
Tap any tile in the grid to add it to your hand. Each tile type shows a badge with how many copies you have currently selected (grayed out when all 4 are used). Red fives (🀔🀛🀒) appear at the end of each suit row.

**Text Input**
Enter tiles using standard notation (e.g., `123m456p789s11z`). The input parses in real time and highlights any errors. Switching to this tab pre-populates it with the current hand, so you can make quick edits. See [Tile Notation Reference](#tile-notation-reference) for the full format.

Tiles are displayed in your hand at the top of the screen. Tap any tile in the hand to remove it. The **Clear** button removes all tiles.

The hand is limited to **13 closed tiles** (with no melds), or fewer based on how many melds you have open. A count of `X / 13 tiles` is shown once you start adding tiles.

---

### Open Melds

If your hand contains called tiles (chi, pon, or kan), declare them as open melds:

1. Tap **+ Open meld** to enter meld-selection mode.
2. Tap the tiles in your hand that form the meld. They will be highlighted as you select them.
3. Choose the meld type: **Chi**, **Pon**, or **Kan**.
4. Tap **Confirm** to move those tiles out of the closed hand and into an open meld block.

Open melds are displayed below the closed hand. Tap the **×** on any meld to remove it (tiles return to the closed hand).

Melds each occupy 3 effective tile slots, reducing the number of closed tiles you can hold. A kan (quad) is treated the same as a pon for tile-count purposes.

---

### Win Options

Win options appear once you have tiles entered. They affect how scoring is calculated for complete hands.

| Option | Notes |
|--------|-------|
| **Tsumo / Ron** | Toggle between tsumo (self-draw) and ron (claimed discard). For ron, the **last tile added to your hand** is treated as the claimed tile. Only shown with 14 effective tiles. |
| **Riichi** | Declares riichi (+1 han). Enables Ippatsu and Double Riichi sub-options. |
| **Double** | Double riichi (declared on your very first discard). Automatically sets Riichi. |
| **Ippatsu** | Win within one go-around of the table after riichi (+1 han). |
| **Last tile** | Haitei (tsumo on the last tile from the wall) or Hōtei (ron on the last discard). +1 han each. |
| **After kan** | Rinshankai (tsumo after a kan draw) or Chankan (ron on a tile added to a pon). +1 han each. |
| **Seat wind** | Your seat wind (East, South, West, North). Affects yakuhai scoring and fu. |
| **Round wind** | The current round wind. Affects yakuhai scoring. |

---

### Dora & Uradora Indicators

Enter the face-up **dora indicator** tiles shown on the wall. The actual dora is the next tile in sequence (e.g., indicator 3m → dora is 4m; indicator 9m → dora is 1m). Wind sequences wrap East→South→West→North→East; dragon sequences wrap Haku→Hatsu→Chun→Haku.

Tap **+ indicator** to add an indicator tile; tap any existing indicator tile to remove it.

The **Ura** selector appears when Riichi is active. Enter ura-dora indicators the same way.

Both dora and ura indicators reduce the "tiles remaining" count shown in the wait display, since those tiles are known to be off the wall.

---

### Analysis Results

**Shanten badge** — displayed whenever you have tiles entered:
- **Tenpai** (green) — one tile away from a complete hand
- **N away from tenpai** (amber) — how many tiles need to be improved
- **Complete hand** (blue) — 14-tile winning hand

**Wait display** (tenpai hands only) — shows each tile that completes the hand:
- Tile glyph and how many copies remain in the unseen pool
- Wait type: Ryanmen (two-sided), Shanpon (dual pair), Kanchan (middle), Penchan (edge), Tanki (pair)
- Remaining count subtracts tiles in your hand and any dora/ura indicator tiles you entered

**Yaku list** (complete hands) — lists every yaku with its han value. Yakuman and double yakuman are labeled distinctly.

**Score panel** (complete hands with valid yaku):
- Han and fu values, with the fu label (e.g., "30 fu", "Pinfu", "Chiitoitsu")
- Total points, with tsumo breakdown (dealer pay / non-dealer pay) or ron total
- Expand **Fu breakdown** to see each fu component itemized

**Notices:**
- *Kyuushu kyuuhai* — 9 or more distinct terminal/honor types in a 13-tile hand; you may declare an abortive draw on your first draw.
- *No yaku* — the shape is complete but no yaku qualifies; add riichi or a yaku-granting tile group.

---

### Furiten Detection

Furiten means you cannot win by ron. The analyzer checks two furiten conditions:

**Discard-based furiten (tenpai)**
If any of your wait tiles appear in the "You" row of the Discard Tracker, those tiles are marked as furiten. In the wait display, furiten tiles show a rose-colored highlight and a "furiten" label. A warning banner names the specific tiles and states that ron is blocked; tsumo is still valid.

**Ron furiten (complete hand)**
When analyzing a 14-tile hand as Ron (`tsumo = false`), the last tile in your hand is treated as the claimed tile. If that tile appears in your own discard pile, the ron is invalid — the yaku and score are suppressed and a warning is shown instead. Switch to Tsumo, or remove the offending tile from your discards.

---

### Discard Tracker

The Discard Tracker is available whenever tiles are entered. It tracks the discard piles of up to 4 players and provides:

**Per-player rows:**
- **You** (Player 1), **P2**, **P3**, **P4**
- Tap **+ discard** to open a tile picker and add a discarded tile for that player
- Tap any tile in the discard pile to remove it

**Furiten badge (You row only)**
If any of your wait tiles appear in your own discard pile, the "You" row turns rose-colored and a **FURITEN** badge appears. The matching tiles in the discard pile are highlighted red.

**Nagashi Mangan indicators**
Each player row shows their current nagashi eligibility:
- **Nagashi possible** (teal) — all discards so far are terminals or honors, and none have been claimed
- **Non-terminal discarded** (gray) — a simples tile was discarded, breaking nagashi eligibility
- **Discard claimed** (gray) — a discard was called by another player

Tap **Mark claimed** to record that a discard from that player was called. Tap again to unmark.

---

### Learning Mode

Toggle **Learning Mode** (book icon, top-right of the analyzer) to practice predicting waits before seeing the answer.

In learning mode, the wait tiles are hidden behind a **Reveal waits** button. Build the hand, decide which tiles you think complete it, then tap to reveal and compare.

Learning mode resets the reveal state whenever the hand changes.

---

## Game Tracker

The Game Tracker records scores across a full game. State is persisted to local storage so you can close and reopen the app mid-game.

### Game Setup

Before starting:

1. Enter player names (defaults: Player 1–4, or Player 1–3 for sanma).
2. Choose **Player Count**: 4-player (Yonma) or 3-player (Sanma).
3. Choose **Game Type**: Hanchan (East + South rounds) or Tonpuusen (East round only).
4. Choose **Entry Mode**: Detailed (enter han and fu) or Quick (enter the point total directly). This can be changed mid-game.
5. Tap **Start & Roll for Dealer**.

---

### Dealer Selection (Dice Roller)

Each player rolls one die. The player with the highest roll becomes East (dealer). Ties among the highest rollers are automatically re-rolled until a single winner is determined.

- Tap a die to roll it.
- Rolled values are shown as die faces (⚀–⚅).
- Once all dice are rolled and a dealer is determined, tap **Confirm Dealer** to begin.

---

### Game Screen

The main game screen shows:

**Header** — current round name (e.g., "East 3"), honba count (●●), and total riichi sticks in the pool.

**Scoreboard** — one row per player showing:
- Seat wind (East/South/West/North)
- Player name
- Current score — tap the score area to toggle between **absolute** (raw points) and **relative** (±points vs. the return score of 30,000 / 35,000 for sanma)
- Riichi indicator: yellow **立直** for riichi, orange **2立直** for double riichi

**Action buttons:**
- **Record Hand** — enter a win
- **Draw** — enter a draw (exhaustive draw / ryuukyoku)
- **Chombo** — penalise an illegal action
- **Nagashi** — award Nagashi Mangan
- **Roll Wall Dice** — roll 2 dice for wall-break position

**Hand log** — collapsible list of completed hands. The most recent entry shows an **Undo** button.

**Entry mode toggle** — switch between Detailed and Quick at any time.

**End Game** — shown when the game has reached its natural conclusion (after South 4 for hanchan, East 4 for tonpuusen) or when a player busts.

---

### Recording a Win

Tap **Record Hand** to open the hand entry sheet.

**Detailed mode (han + fu):**
1. Select the winner by tapping their name.
2. Toggle **Tsumo** or **Ron**. For ron, also select the discarder.
3. Mark any **Riichi** declarations (tap once for 立直, again for 2立直 double riichi, again to clear). Each declaration deducts 1,000 from that player and adds to the pool.
4. Select **Han** (1–13 for limit hands, 26 for double yakuman).
5. Select **Fu** from the grid (20, 25, 30, 40, 50, 60, 70, 80, 90, 100).
6. The payment preview updates live. Review it, then tap **Confirm**.

**Quick mode (point total):**
1. Select winner and Tsumo/Ron as above.
2. Mark riichi declarations as above.
3. Tap a common point value button or type directly.
4. Tap **Confirm**.

**After confirming:** scores update, the riichi pool transfers to the winner, a log entry is recorded, and the round advances (or honba increments if the dealer won).

---

### Recording a Draw

Tap **Draw** to open the draw sheet.

- Check the **Tenpai** box for each player who is tenpai.
- The payment preview shows the EMA draw settlement:
  - All tenpai players split 3,000 points equally between them.
  - Each noten (non-tenpai) player pays 1,000 points.
  - (e.g., 1 tenpai: receives 3,000; 3 noten: each pay 1,000)
- Tap **Confirm**.

**Round advancement:**
- Dealer tenpai → dealer retains (renchan); honba increments.
- Dealer noten → round advances; honba increments.
- All players tenpai or all noten → round also advances.

---

### Chombo

Tap **Chombo** to penalise a player for an illegal action (e.g., calling a winning hand incorrectly, illegal riichi).

- Select the offending player.
- The offender pays a mangan penalty to each other player; no riichi pool is awarded.
- The round does **not** advance. Honba does not change.

---

### Nagashi Mangan

Tap **Nagashi** to award Nagashi Mangan to a player.

- Select the Nagashi player.
- Payments follow standard mangan tsumo rates (dealer: 4,000 all; non-dealer: 2,000/4,000).
- The round advances after Nagashi Mangan.

---

### Wall Dice

Tap **Roll Wall Dice** to access the 2-dice wall-break roller. The sum indicates which player's wall section is broken and is shown for reference. Tap the dice to roll; tap **Done** to return to the game screen without recording any score change.

---

### Riichi & Double Riichi

On the game screen, tap a player's riichi indicator area (or use the riichi buttons in the hand entry sheet) to cycle through states:

- **None** → **立直 Riichi** → **2立直 Double Riichi** → **None**

Each declaration deducts 1,000 from the declaring player and adds a stick to the pool. The pool total is shown in the header.

When a hand is confirmed, all declared riichi sticks in the pool transfer to the winner. On a draw, the pool carries over.

---

### Bust Detection

After each hand, if any player's score drops below 0, a **Bust** notice appears:

- **Continue** — keep playing despite the negative score (some house rules allow this).
- **End Game** — proceed directly to the end-of-game screen.

---

### Undo

The most recent hand can be undone from the hand log. Tap **Undo** on the latest entry to restore all scores, round position, honba, and riichi pool to their state before that hand was recorded.

Only the most recent hand can be undone.

---

### End of Game

The end-of-game screen shows:

| Column | Description |
|--------|-------------|
| Player | Name |
| Score | Final raw score |
| Placement | 1st–4th (or 1st–3rd for sanma) |
| Uma | Placement bonus: +15k/+5k/−5k/−15k (4-player) or +15k/0/−15k (3-player) |
| Total | Score − return (30,000 or 35,000) + uma |

**Score History** — a chart showing each player's score after every hand. Useful for reviewing the flow of the game.

**Export** — saves a JSON file with the complete game log, including per-hand snapshots, for record-keeping or analysis.

**New Game** — resets all state and returns to the setup screen.

---

## 3-Player (Sanma) Mode

Select **3 Players (Sanma)** on the game setup screen. Differences from standard 4-player:

| Rule | 4-Player | 3-Player |
|------|----------|----------|
| Starting score | 30,000 | 35,000 |
| Return score | 30,000 | 35,000 |
| Seat winds | E / S / W / N | E / S / W |
| Uma | +15k / +5k / −5k / −15k | +15k / 0 / −15k |
| Tsumo payers | 3 | 2 |
| Ron honba bonus | 300 / honba | 200 / honba |
| Draw noten payments | 3 × 1,000 | 2 × 1,000 |
| Dealer dice | 4 | 3 |
| Wall dice player count | 4 positions | 3 positions |

All scoring, undo, bust detection, and end-of-game logic adjusts automatically.

---

## Tile Notation Reference

Tiles are written as digits followed by a suit letter. Multiple digits before a suit share that suit.

| Suit | Letter | Range | Example |
|------|--------|-------|---------|
| Man (characters) | `m` | 1–9 | `123m` = 1m, 2m, 3m |
| Pin (circles) | `p` | 1–9 | `456p` = 4p, 5p, 6p |
| Sou (bamboo) | `s` | 1–9 | `789s` = 7s, 8s, 9s |
| Honors | `z` | 1–7 | `1234z` = East, South, West, North |

Honor values: `1z` East · `2z` South · `3z` West · `4z` North · `5z` Haku · `6z` Hatsu · `7z` Chun

**Red fives (aka dora):** prefix with `0` — `0m`, `0p`, `0s`.

**Full hand example:** `0m234m456p78s567s11z`
- 0m (red 5-man), 2m, 3m, 4m, 4p, 5p, 6p, 7s, 8s, 5s, 6s, 7s, East × 2

Spaces are ignored. An error is shown if digits have no following suit letter, or if honor values fall outside 1–7.
