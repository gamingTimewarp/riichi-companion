# Ruleset Compatibility & Competitive Feature Review

## Purpose
This document reviews the current Riichi Companion codebase, compares it against common feature sets in established riichi tools, and identifies:

1. Missing features that matter for broader adoption.
2. Existing hard-coded behavior that should become user-selectable toggles for cross-ruleset compatibility.

Release planning note:
- **v1.1.0** ships the current rules-profile foundation and high-priority toggles already implemented.
- **v1.2.0** is in progress with initial rule-toggle guardrails/validation UX and broader preset completeness; additional refinement remains planned.

---

## 1) Current Codebase Overview

### 1.1 Existing strengths
- Analyzer coverage is already strong: shanten, waits, yaku/fu, furiten, dora/ura, and learning mode.
- Tracker supports both 3p/4p, detailed + quick entry, draw/chombo/nagashi, undo, and JSON export.
- Core scoring logic is centralized and relatively cleanly separated in `src/lib/scoring.js`.

### 1.2 Current rule configurability
Currently configurable in UI:
- Player count (3 or 4).
- Game length (tonpuusen/hanchan).
- Draw payment method (`fixed-pool` or `fixed-noten`).
- Entry mode (detailed/quick).

Current rules that are effectively fixed/hard-coded:
- Start scores (30k yonma / 35k sanma).
- Return points (30k/35k) and uma arrays.
- Honba value (+100 per payer).
- Riichi stick value (1000).
- Chombo payment model and “round/honba no change” behavior.
- End condition by round index (East-only or East+South) plus bust modal behavior.

---

## 2) Competitive Comparison (High-Level)

The following is a practical benchmark against widely used riichi software categories (online clients and score tools):

## 2.1 Commonly expected in mature apps
- Ruleset presets (EMA, WRC, JPML-like, M-League style, custom).
- Per-rule toggles for open tanyao, red fives, kiriage mangan, multiple ron, etc.
- Flexible game-end handling (tobi/bust on/off, oka/uma variants, oka with return-point bonus).
- Log import/export compatibility (Tenhou-style/JSON variants).
- Round continuation options (agari-yame/west round extensions/target-score end rules).

## 2.2 Gaps vs those expectations
Riichi Companion is already good for EMA-centric play, but for broader compatibility it is missing:
- Ruleset preset system.
- Advanced end-condition toggles.
- Tie-break configuration (who wins ties; honba continuation details by ruleset).
- Multiple-ron/head-bump behavior toggle.
- Kiriage mangan / kazoe yakuman treatment options.
- Configurable red-five counts and optional no-red table mode.

---

## 3) Behaviors That Should Become Optional Toggles

Priority is based on impact x implementation complexity.

## 3.1 High-priority toggles (implement first)
1. **Open tanyao (kuitan) on/off**
   - Reason: Core compatibility switch across rule families.
2. **Red fives enabled + count per suit**
   - Reason: Very common divergence (0/3/4 red tiles depending on format).
3. **Uma/oka profile selection**
   - Reason: End-game scoring profile is one of the largest cross-league differences.
4. **Bust/tobi ends game immediately on/off**
   - Reason: Already hinted by UI language; should be explicit and persisted.
5. **All-tenpai continuation policy**
   - Reason: Some groups expect configurable handling of edge continuation logic.

## 3.2 Medium-priority toggles
6. **Kiriage mangan on/off** (e.g., 4 han 30 fu and 3 han 60 fu handling variants).
7. **Kazoe yakuman cap policy** (counted yakuman allowed/capped).
8. **Multiple ron policy** (allow multiple winners vs head-bump/atamahane).
9. **Nagashi mangan variant policy** (interaction with riichi sticks/honba).
10. **Chombo payment style** (table-specific implementations vary).

## 3.3 Lower-priority / advanced toggles
11. **Renhou treatment** (none / mangan / yakuman).
12. **Double-yakuman split toggles** for variant yakuman counting.
13. **Round extension rules** (West round, target-score continuation).
14. **Agari-yame (dealer stop) conditions**.

---

## 4) Proposed Ruleset Data Model

Introduce a persisted rules profile object (store + export schema):

```ts
{
  id: string,
  name: string,
  presetBase: 'EMA' | 'WRC' | 'JPML' | 'M_LEAGUE' | 'CUSTOM',

  playerRules: {
    numPlayers: 3 | 4,
    startScore: number,
    returnScore: number,
    riichiStickValue: number,
    honbaValuePerPayer: number,
    bustEndsGame: boolean,
  },

  yakuRules: {
    openTanyao: boolean,
    redDora: { enabled: boolean, man: number, pin: number, sou: number },
    kiriageMangan: boolean,
    kazoeYakuman: 'enabled' | 'capped' | 'disabled',
    renhou: 'none' | 'mangan' | 'yakuman',
  },

  drawAndWinRules: {
    drawPaymentRule: 'fixed-noten' | 'fixed-pool',
    allTenpaiDealerStays: boolean,
    multipleRon: 'allow' | 'head-bump',
    nagashiVariant: 'mangan-tsumo' | 'table-custom',
    chomboVariant: 'ema-default' | 'table-custom',
  },

  rankingRules: {
    uma: number[],
    oka: number,
    tieBreak: 'seat-order' | 'shared' | 'custom',
  },

  progressionRules: {
    gameType: 'tonpuusen' | 'hanchan' | 'custom-round-cap',
    roundCap: number,
    allowWestRoundExtension: boolean,
    agariYame: boolean,
  }
}
```

---

## 5) Suggested Implementation Sequence

1. Add `rulesProfile` to game state + persistence versioning.
2. Replace hard-coded values in scoring/progression with profile reads.
3. Add presets (EMA default first, then WRC-like + “Custom”).
4. Add UI for high-priority toggles in Game Setup (advanced section).
5. Extend export format with rules snapshot for replay/debug parity.
6. Add regression vectors per preset.

---

## 6) Immediate Backlog Additions (next sprint)

1. Rules profile type + default EMA profile in store.
2. Migrate `calculateFinalScores` to accept uma/oka/return as parameters.
3. Add `bustEndsGame` toggle in setup and bust modal flow.
4. Add `openTanyao` and `redDora` toggles feeding analyzer/scoring options.
5. Add preset picker (`EMA`, `WRC-like`, `Custom`) and lock/unlock advanced controls.
6. Add tests for profile-driven scoring and round progression branches.

---

## 7) Recommendation

Proceed with the Android roadmap, but gate release quality on a **rules profile milestone** early in implementation. Without this, the app will ship as a strong EMA-focused tool but will struggle to satisfy mixed-club and international compatibility expectations.


## 8) v1.3 Follow-ups

1. Add global reset action for rules/settings profiles to simplify support and table handoffs.
2. Add extra golden test vectors for complex policy interactions (kiriage + kazoe + rounding edge cases).
