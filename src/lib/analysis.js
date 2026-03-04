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
  const empty = { shanten: Infinity, waits: [], isAgari: false, yaku: {}, yakuman: 0, fu: 0, han: 0, ten: 0 }
  if (tiles.length === 0) return empty

  const melds = opts.melds ?? []
  const openPart = melds.map((m) => ({
    open: m.open,
    tiles: m.tiles.map(tileToRiichi),
  }))

  // Each meld occupies exactly 3 effective slots regardless of type (pon, chi, or kan)
  const totalTiles = tiles.length + melds.length * 3

  const akaCount = tiles.filter((t) => t.isAka).length

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
      akaCount > 0,   // allowAka
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

  return {
    shanten,
    waits,
    isAgari,
    yaku: yakuObj,
    yakuman: result.yakuman ?? 0,
    fu: result.fu ?? 0,
    han: result.han ?? 0,
    ten: result.ten ?? 0,
    outgoingTen: result.outgoingTen,  // { oya, ko } dealer/non-dealer breakdown
    noYaku: result.text === 'no yaku',
    fuBreakdown,
    isKyuushu,
    raw: result,
  }
}
