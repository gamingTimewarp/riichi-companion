/**
 * Wrapper around riichi-ts that normalises the result for the UI.
 *
 * riichi-ts constructor (positional args):
 *   new Riichi(closedPart, openPart, options, tileDiscardedBySomeone,
 *              firstTake, riichi, ippatsu, doubleRiichi,
 *              lastTile, afterKan, akaCount, allowAka, allowKuitan, withKiriage)
 *
 * options: { dora: int[] }
 * tileDiscardedBySomeone: int | null  (null = tsumo, int = ron tile)
 * lastTile: boolean  (haitei/houteiraoyui)
 *
 * result.hairi.now  = shanten (-1 = complete, 0 = tenpai, n = n away)
 * result.hairi.wait = int[] of winning tile ids (when tenpai/complete)
 */

import { Riichi } from 'riichi-ts'
import { tilesToRiichiInts } from './tiles.js'

/**
 * Analyse a hand for shanten and (if winning) score.
 *
 * @param {TileObject[]} tiles — 1–14 tile objects
 * @param {object} opts
 * @param {boolean} opts.tsumo
 * @param {boolean} opts.riichi
 * @param {boolean} opts.ippatsu
 * @param {boolean} opts.lastTile — haitei/houteiraoyui
 * @param {boolean} opts.kuitan — allow open tanyao (EMA default: true)
 * @returns {AnalysisResult}
 */
export function analyseHand(tiles, opts = {}) {
  if (tiles.length === 0) {
    return { shanten: Infinity, waits: [], yaku: {}, fu: 0, han: 0, ten: 0 }
  }

  const ints = tilesToRiichiInts(tiles)
  const akaCount = tiles.filter((t) => t.isAka).length
  const { tsumo = false, riichi = false, ippatsu = false, lastTile = false } = opts
  // EMA ruleset: kuitan allowed
  const allowKuitan = opts.kuitan !== false

  let result
  try {
    const r = new Riichi(
      ints,          // closedPart
      [],            // openPart (meld objects)
      { dora: [] },  // options
      tsumo ? null : undefined, // tileDiscardedBySomeone (null = tsumo win, undefined = shanten mode)
      false,         // firstTake (tenhou/chiihou)
      riichi,
      ippatsu,
      false,         // doubleRiichi
      lastTile,
      false,         // afterKan
      akaCount,
      akaCount > 0,  // allowAka
      allowKuitan,
      false,         // withKiriage
    )
    result = r.calc()
  } catch (e) {
    console.error('riichi-ts error:', e)
    return { shanten: Infinity, waits: [], yaku: {}, fu: 0, han: 0, ten: 0, error: e.message }
  }

  const shanten = result.hairi?.now ?? Infinity
  const waits = result.hairi?.wait ?? []

  return {
    shanten,
    waits,         // riichi-ts integer tile ids
    isAgari: result.isAgari ?? false,
    yaku: result.yaku ?? {},
    yakuman: result.yakuman ?? 0,
    fu: result.fu ?? 0,
    han: result.han ?? 0,
    ten: result.ten ?? 0,
    raw: result,
  }
}
