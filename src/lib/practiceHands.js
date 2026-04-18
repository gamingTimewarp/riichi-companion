/**
 * Random tenpai hand generator for practice mode.
 *
 * Strategy: build a 13-tile hand from structured blocks (chi/pon/pair + wait shape),
 * then verify with analyseHand. Retry up to 60 times; fall back to a hardcoded hand
 * if all attempts fail.
 *
 * Wait types generated:
 *   ryanmen  — two-sided (e.g. 56 waiting on 4 or 7)
 *   kanchan  — middle tile (e.g. 24 waiting on 3)
 *   penchan  — edge (12 waiting on 3, or 89 waiting on 7)
 *   shanpon  — dual pair (two incomplete pairs, waiting on either)
 *   tanki    — pair wait (lone tile waits for its pair)
 *   chiitoi  — seven pairs (6 complete pairs + lone tanki tile)
 */

import { analyseHand } from './analysis.js'

const NUM_SUITS = ['m', 'p', 's']

function ri(n) { return Math.floor(Math.random() * n) }
function pick(arr) { return arr[ri(arr.length)] }

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = ri(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function t(suit, value) { return { suit, value, isAka: false } }
function chi(s, v) { return [t(s, v), t(s, v + 1), t(s, v + 2)] }
function pon(s, v) { return [t(s, v), t(s, v), t(s, v)] }

// Verify no tile appears more than 4 times
function isValidCounts(tiles) {
  const counts = {}
  for (const tile of tiles) {
    const k = `${tile.suit}${tile.value}`
    counts[k] = (counts[k] ?? 0) + 1
    if (counts[k] > 4) return false
  }
  return true
}

function genStandard(waitType) {
  // Three chi filler blocks, one per suit (shuffled order)
  const fillerSuits = shuffle([...NUM_SUITS])
  const fillerBlocks = fillerSuits.map(s => chi(s, 1 + ri(7)))

  let waitTiles, pairTiles

  if (waitType === 'ryanmen') {
    const s = pick(NUM_SUITS)
    const v = 2 + ri(6)                        // 2–7 → waits on v-1 and v+2
    waitTiles = [t(s, v), t(s, v + 1)]
    const ps = pick([...NUM_SUITS, 'z'])
    const pv = ps === 'z' ? 1 + ri(7) : 1 + ri(9)
    pairTiles = [t(ps, pv), t(ps, pv)]

  } else if (waitType === 'kanchan') {
    const s = pick(NUM_SUITS)
    const v = 1 + ri(7)                        // 1–7 → waits on v+1
    waitTiles = [t(s, v), t(s, v + 2)]
    const ps = pick([...NUM_SUITS, 'z'])
    const pv = ps === 'z' ? 1 + ri(7) : 1 + ri(9)
    pairTiles = [t(ps, pv), t(ps, pv)]

  } else if (waitType === 'penchan') {
    const s = pick(NUM_SUITS)
    const isLow = ri(2) === 0
    waitTiles = isLow ? [t(s, 1), t(s, 2)] : [t(s, 8), t(s, 9)]
    const ps = pick([...NUM_SUITS, 'z'])
    const pv = ps === 'z' ? 1 + ri(7) : 1 + ri(9)
    pairTiles = [t(ps, pv), t(ps, pv)]

  } else if (waitType === 'shanpon') {
    const s1 = pick(NUM_SUITS)
    const v1 = 1 + ri(9)
    const s2 = pick([...NUM_SUITS, 'z'])
    const v2 = s2 === 'z' ? 1 + ri(7) : 1 + ri(9)
    // Two lone pairs — shanpon shape (both together, then verified by analyseHand)
    waitTiles = [t(s1, v1), t(s1, v1)]
    pairTiles = [t(s2, v2), t(s2, v2)]

  } else if (waitType === 'tanki') {
    const ponSuit = pick(NUM_SUITS)
    const ponVal = 1 + ri(9)
    fillerBlocks[0] = pon(ponSuit, ponVal)     // replace one chi with a pon
    const ws = pick([...NUM_SUITS, 'z'])
    const wv = ws === 'z' ? 1 + ri(7) : 1 + ri(9)
    const allTiles = [...fillerBlocks.flat(), t(ws, wv)]
    if (allTiles.length !== 13 || !isValidCounts(allTiles)) return null
    return { tiles: shuffle(allTiles), waitType }

  } else {
    return null
  }

  const allTiles = [...fillerBlocks.flat(), ...waitTiles, ...pairTiles]
  if (allTiles.length !== 13 || !isValidCounts(allTiles)) return null
  return { tiles: shuffle(allTiles), waitType }
}

function genChiitoi() {
  const usedKeys = new Set()
  const tiles = []

  for (let i = 0; i < 6; i++) {
    let placed = false
    for (let attempt = 0; attempt < 30; attempt++) {
      const s = pick(i < 3 ? NUM_SUITS : [...NUM_SUITS, 'z'])
      const v = s === 'z' ? 1 + ri(7) : 1 + ri(9)
      const k = `${s}${v}`
      if (!usedKeys.has(k)) {
        usedKeys.add(k)
        tiles.push(t(s, v), t(s, v))
        placed = true
        break
      }
    }
    if (!placed) return null
  }

  // Add one lone tanki tile
  for (let attempt = 0; attempt < 30; attempt++) {
    const s = pick([...NUM_SUITS, 'z'])
    const v = s === 'z' ? 1 + ri(7) : 1 + ri(9)
    const k = `${s}${v}`
    if (!usedKeys.has(k)) {
      tiles.push(t(s, v))
      break
    }
  }

  if (tiles.length !== 13) return null
  return { tiles: shuffle(tiles), waitType: 'chiitoi' }
}

/**
 * Generate a random tenpai practice hand.
 *
 * @returns {{ tiles: TileObject[], waitType: string, waits: number[] }}
 *   tiles    — 13-tile hand (shuffled for practice challenge)
 *   waitType — one of ryanmen / kanchan / penchan / shanpon / tanki / chiitoi
 *   waits    — riichi-ts integers for the actual wait tiles (verified)
 */
export function generatePracticeHand() {
  // Weighted table: ryanmen appears twice so common patterns are seen more often
  const TYPES = ['ryanmen', 'ryanmen', 'kanchan', 'penchan', 'shanpon', 'tanki', 'chiitoi']

  for (let attempt = 0; attempt < 60; attempt++) {
    const type = pick(TYPES)
    const hand = type === 'chiitoi' ? genChiitoi() : genStandard(type)
    if (!hand) continue

    const result = analyseHand(hand.tiles, { bakaze: 27, jikaze: 27 })
    if (result.shanten === 0 && result.waits?.length > 0) {
      return { ...hand, waits: result.waits }
    }
  }

  // Hardcoded fallback: ryanmen 56m with clear filler blocks
  const fallback = [
    t('m', 5), t('m', 6),
    t('p', 1), t('p', 2), t('p', 3),
    t('p', 4), t('p', 5), t('p', 6),
    t('s', 7), t('s', 8), t('s', 9),
    t('z', 1), t('z', 1),
  ]
  const res = analyseHand(fallback, { bakaze: 27, jikaze: 27 })
  return { tiles: shuffle(fallback), waitType: 'ryanmen', waits: res.waits ?? [4, 7] }
}
