/**
 * Wrapper around riichi-ts that normalises the result for the UI.
 *
 * riichi-ts constructor:
 *   new Riichi(closedPart, openPart, options, tileDiscardedBySomeone,
 *              firstTake, riichi, ippatsu, doubleRiichi,
 *              lastTile, afterKan, akaCount, allowAka, allowKuitan, withKiriage)
 *
 * options: { dora?, bakaze, jikaze }  — bakaze/jikaze MUST be supplied (overrides class defaults)
 * tileDiscardedBySomeone: null=tsumo win, int=ron tile, undefined=shanten-only
 *
 * KEY BEHAVIOUR:
 *   - For winning 14-tile hands riichi-ts does NOT populate hairi — isAgari=true signals the win.
 *   - We therefore derive shanten=-1 from isAgari rather than hairi.now.
 *   - Tile-counts divisible by 3 cause riichi-ts to bail early; callers should guard against this.
 */

import { Riichi } from 'riichi-ts'
import { tilesToRiichiInts, tileToRiichi, indicatorToDoraInt } from './tiles.js'
import { getFuBreakdown } from './fuCalc.js'
import { calculateBasePoints } from './scoring.js'

// Terminals: 1m/9m/1p/9p/1s/9s + all 7 honors (riichi-ts ints)
const TERMINAL_HONOR_SET = new Set([0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33])

function detectKyuushu(tiles) {
  const distinct = new Set(tiles.map(tileToRiichi).filter((id) => TERMINAL_HONOR_SET.has(id)))
  return distinct.size >= 9
}

/**
 * Analyse a hand for shanten and (if winning) score.
 *
 * @param {TileObject[]} tiles  — closed hand tiles (1–14)
 * @param {object} opts
 * @param {boolean}      opts.tsumo      — true=score as tsumo, false=shanten-only for 14 tiles
 * @param {boolean}      opts.riichi
 * @param {boolean}      opts.ippatsu
 * @param {boolean}      opts.lastTile   — haitei/houteiraoyui
 * @param {boolean}      opts.kuitan     — allow open tanyao (EMA default: true)
 * @param {number}       opts.bakaze     — round wind tile int (default 27 = East)
 * @param {number}       opts.jikaze     — seat wind tile int  (default 27 = East)
 * @param {Array}        opts.melds      — [{ open: boolean, tiles: TileObject[] }]
 * @returns {AnalysisResult}
 */
export function analyseHand(tiles, opts = {}) {
  // Strip extra tiles (suit 'f') — they are declared separately as bonus dora and
  // must never be passed to riichi-ts.
  tiles = tiles.filter((t) => t.suit !== 'f')

  const empty = { shanten: Infinity, waits: [], isAgari: false, yaku: {}, yakuman: 0, fu: 0, han: 0, ten: 0 }
  if (tiles.length === 0) return empty

  const melds = opts.melds ?? []
  const openPart = melds.map((m) => ({
    open: m.open,
    tiles: m.tiles.map(tileToRiichi),
  }))

  // Each meld occupies exactly 3 effective slots regardless of type (pon, chi, or kan)
  const totalTiles = tiles.length + melds.length * 3

  const allowAka = opts.allowAka !== false
  const redLimits = opts.redFives ?? { m: 1, p: 1, s: 1 }
  const allTiles = [...tiles, ...melds.flatMap((m) => m.tiles)]
  const akaCountsBySuit = allowAka
    ? allTiles.filter((t) => t.isAka).reduce((acc, t) => {
      acc[t.suit] = (acc[t.suit] ?? 0) + 1
      return acc
    }, { m: 0, p: 0, s: 0 })
    : { m: 0, p: 0, s: 0 }
  const akaCount = allowAka
    ? ['m', 'p', 's'].reduce((acc, suit) => acc + Math.min(akaCountsBySuit[suit] ?? 0, redLimits?.[suit] ?? 0), 0)
    : 0

  const {
    tsumo,
    riichi = false,
    ippatsu = false,
    doubleRiichi = false,
    lastTile = false,
    afterKan = false,
    bakaze = 27,  // East round (must be supplied — riichi-ts overrides class defaults with undefined)
    jikaze = 27,  // East seat
    doraIndicators = [],
    uraIndicators = [],
  } = opts
  const numPlayers = opts.numPlayers ?? 4
  const allowKuitan = opts.kuitan !== false

  // Convert indicator tiles to actual dora tile integers for riichi-ts.
  // Uradora only counts when riichi is declared.
  const doraTiles = [
    ...doraIndicators.map(indicatorToDoraInt),
    ...(riichi ? uraIndicators.map(indicatorToDoraInt) : []),
  ]

  // For ron: last tile in input order is the winning tile claimed from a discard.
  // Pass it as tileDiscardedBySomeone (int) and the remaining 13 tiles as closedPart.
  // For tsumo: all 14 sorted tiles; riichi-ts treats the last sorted tile as drawn.
  const is14 = totalTiles >= 14
  const isRon = is14 && tsumo === false
  const ronTile = isRon ? tiles[tiles.length - 1] : null

  const ints = isRon
    ? tilesToRiichiInts(tiles.slice(0, -1))  // 13 sorted tiles for ron
    : tilesToRiichiInts(tiles)               // 14 sorted tiles for tsumo/shanten

  const tileDiscardedBySomeone = is14
    ? (isRon ? tileToRiichi(ronTile) : null)  // int=ron, null=tsumo
    : undefined                               // undefined=shanten-only

  let result
  try {
    const r = new Riichi(
      ints,
      openPart,
      { dora: doraTiles, bakaze, jikaze },
      tileDiscardedBySomeone,
      false,          // firstTake
      riichi,
      ippatsu,
      doubleRiichi,
      lastTile,
      afterKan,
      akaCount,
      allowAka,
      allowKuitan,
      false,          // withKiriage
    )
    result = r.calc()
  } catch (e) {
    console.error('riichi-ts error:', e)
    return { ...empty, error: e.message }
  }

  // For winning hands riichi-ts does NOT set hairi — derive shanten from isAgari.
  const isAgari = result.isAgari ?? false
  const shanten = isAgari ? -1 : (result.hairi?.now ?? Infinity)
  const waits = isAgari ? [] : (result.hairi?.wait ?? [])

  const yakuObj = result.yaku ?? {}

  let fuBreakdown = null
  if (isAgari) {
    fuBreakdown = getFuBreakdown(tiles, melds, {
      isTsumo: !isRon,
      wonTile: ronTile,  // null for tsumo (fuCalc falls back to last sorted tile)
      bakaze,
      jikaze,
      yaku: yakuObj,
    })
  }

  // Kyuushu kyuuhai: 13-tile hand with 9+ distinct terminal/honor types
  const isKyuushu = tiles.length === 13 && melds.length === 0 && detectKyuushu(tiles)

  // riichi-ts computes `ten` assuming 4 payers. Recompute from per-player amounts when
  // outgoingTen is available so the total is correct for any numPlayers (e.g. 3p tsumo).
  // outgoingTen.oya = dealer pays, outgoingTen.ko = each non-dealer pays.
  const outgoingTen = result.outgoingTen
  let ten = result.ten ?? 0
  if (isAgari && !isRon && outgoingTen) {
    const isDealer = jikaze === 27
    ten = isDealer
      ? outgoingTen.ko * (numPlayers - 1)               // all non-dealers pay ko
      : outgoingTen.oya + outgoingTen.ko * (numPlayers - 2) // dealer pays oya, others pay ko
  }

  return {
    shanten,
    waits,
    isAgari,
    ronTile,  // TileObject | null — the claimed winning tile for a ron, null for tsumo/shanten
    yaku: yakuObj,
    yakuman: result.yakuman ?? 0,
    fu: result.fu ?? 0,
    han: result.han ?? 0,
    ten,
    outgoingTen,  // { oya, ko } dealer/non-dealer breakdown
    noYaku: result.text === 'no yaku',
    fuBreakdown,
    isKyuushu,
    raw: result,
  }
}

const r100 = (n) => Math.ceil(n / 100) * 100

/**
 * Augments an analysis result with declared bonus dora tiles:
 *   - nukidora (北抜き): North tiles declared in sanma
 *   - extradora: flower/season tiles declared in variants that use them
 * Each declared tile adds +1 han. Also recomputes ten/outgoingTen.
 *
 * @param {object|null} result        — raw analyseHand result
 * @param {number} nukidoraCount      — North tiles declared as nukidora
 * @param {object} winOpts            — { tsumo, jikaze }
 * @param {object} [rules]            — { kiriageMangan, kazoeYakumanPolicy }
 * @param {number} [extraDoraCount]   — flower/season tiles declared as extra dora
 */
export function augmentNukidora(result, nukidoraCount, winOpts, rules = {}, extraDoraCount = 0) {
  const count = nukidoraCount + extraDoraCount
  if (!count || !result?.isAgari || result?.noYaku) return result

  const augHan = result.han + count
  const augYaku = { ...result.yaku }
  if (nukidoraCount > 0) augYaku.nukidora = nukidoraCount
  if (extraDoraCount > 0) augYaku.extradora = extraDoraCount
  const isDealer = (winOpts.jikaze ?? 27) === 27
  const numPlayers = rules.numPlayers ?? 4
  const base = calculateBasePoints(augHan, result.fu, {
    kiriageMangan: rules.kiriageMangan ?? false,
    kazoeYakumanPolicy: rules.kazoeYakumanPolicy ?? 'enabled',
  })

  let ten, outgoingTen
  if (!(winOpts.tsumo ?? true)) {
    ten = r100(isDealer ? base * 6 : base * 4)
  } else {
    const dp = r100(base * 2)
    const np = r100(base)
    outgoingTen = { oya: dp, ko: isDealer ? dp : np }
    ten = isDealer
      ? dp * (numPlayers - 1)
      : dp + np * (numPlayers - 2)
  }

  return { ...result, han: augHan, yaku: augYaku, ten, outgoingTen }
}
