# Implementation Notes

## Akadora (Red Fives)

### Rules
- Standard EMA set includes 3 aka: one each of 0m (red 5-man), 0p (red 5-pin), 0s (red 5-sou)
- Each aka in the winning hand adds **1 han** as bonus dora (on top of any regular dora)
- Aka do not count as yaku — they only contribute han to an already-valid hand
- A hand with only aka (no yaku, no riichi) is not a valid winning hand

### Notation
- `0m` = red 5-man, `0p` = red 5-pin, `0s` = red 5-sou
- In parsed tile objects: `{ suit: 'm', value: 5, isAka: true }`
- The tile integer passed to riichi-ts is the same as a normal 5 (4, 13, or 22)

### riichi-ts Integration
```js
// Count aka tiles in hand
const akaCount = tiles.filter(t => t.isAka).length

new Riichi(
  closedInts,
  [],
  { dora: [] },
  ...,
  akaCount,   // 10th arg: akaCount
  true,       // 11th arg: allowAka (enable aka dora scoring)
)
// result.yaku.akadora = N  (number of aka in hand, or absent if 0)
```

### UI Requirements (Phase 2)

**Tile Picker**
- Red fives are a separate tap state: normal 5 → red 5 → removed (3-state cycle)
  OR: long-press / hold to toggle aka on an already-selected 5
- Visually: red/orange numeral on the tile, distinct from normal 5
- At most 1 of each aka per standard set — picker should enforce this cap

**Text Input**
- `0m`, `0p`, `0s` in notation → parsed as aka automatically
- `parseNotation` already handles this (returns `isAka: true`)
- Error if user enters more than 1 of any specific aka

**Profile Toggle**
- `profileStore.toggles.akaEnabled` (default: true per EMA)
- When disabled: aka tiles treated as normal 5s, `allowAka: false` passed to riichi-ts

**Remaining Tile Count**
- Known aka in discards reduces "remaining" for that wait tile
- Display should distinguish: "2× 5m remaining (1 is red)"

### Scoring Display
- Aka han shown in `YakuList` as "Bonus Dora (Akadora) ×N" — same row style as regular dora
- Not shown in fu breakdown (it's han-only, no fu effect)

---

## riichi-ts Constructor Reference (Full)

```
new Riichi(
  closedPart,            // int[] — closed tiles (13 for shanten, 14 for win)
  openPart,              // OpenSet[] — melds (empty [] for closed hand)
  options,               // { dora: int[] } — indicator tiles, NOT the dora tiles themselves
  tileDiscardedBySomeone,// int | null | undefined — null=tsumo, int=ron tile, undefined=shanten only
  firstTake,             // boolean — tenhou (dealer) / chiihou (non-dealer)
  riichi,                // boolean
  ippatsu,               // boolean
  doubleRiichi,          // boolean
  lastTile,              // boolean — haitei (tsumo) / houteiraoyui (ron)
  afterKan,              // boolean — rinshan (tsumo after kan) / chankan (ron on kan)
  akaCount,              // number — count of aka dora in hand
  allowAka,              // boolean — enable aka dora scoring
  allowKuitan,           // boolean — open tanyao (EMA: true)
  withKiriage,           // boolean — round up mangan (EMA: false)
)
```

**Key result fields:**
- `result.hairi.now` — shanten number (-1 = complete, 0 = tenpai)
- `result.hairi.wait` — int[] winning tile ids (only meaningful when now ≥ 0)
- `result.isAgari` — true if complete winning hand (14 tiles)
- `result.yaku` — `{ yakuName: han }` object
- `result.yakuman` — yakuman multiplier (0 if not yakuman)
- `result.han`, `result.fu`, `result.ten` — totals (only set if isAgari)

**Note:** `options.dora` takes **indicator** tiles (the tile before each dora in the wall),
not the dora tiles themselves. To show 5m as dora, pass `[3]` (4m indicator → 5m dora).
For shanten-only analysis without dora, pass `{ dora: [] }`.
