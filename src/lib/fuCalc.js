/**
 * Fu breakdown calculator for Riichi Mahjong.
 *
 * Decomposes a closed hand into sets and calculates fu components.
 * Returns the decomposition with the highest fu.
 */

import { tileToRiichi } from './tiles.js'

// ── Tile helpers ──────────────────────────────────────────────────────────────

function isHonorOrTerminal(id) {
  return id >= 27 || id % 9 === 0 || id % 9 === 8
}

function tileShortName(id) {
  if (id === 27) return 'East'
  if (id === 28) return 'South'
  if (id === 29) return 'West'
  if (id === 30) return 'North'
  if (id === 31) return 'Haku'
  if (id === 32) return 'Hatsu'
  if (id === 33) return 'Chun'
  const suits = ['m', 'p', 's']
  const suitIndex = Math.floor(id / 9)
  const val = (id % 9) + 1
  return `${val}${suits[suitIndex]}`
}

// ── Hand decomposition ────────────────────────────────────────────────────────

/**
 * Recursively collect all valid set configurations from a haipai array.
 * haipai: int[34] tile count array (mutated in place, restored after each branch)
 * currentSets: {type, tile?, tiles?}[] being built
 * results: array to push completed decompositions into
 */
function collectSets(haipai, currentSets, results) {
  // Find first non-zero tile
  let f = -1
  for (let i = 0; i < haipai.length; i++) {
    if (haipai[i] > 0) { f = i; break }
  }

  if (f === -1) {
    // All tiles consumed — valid decomposition found
    results.push(currentSets.slice())
    return
  }

  // Try triplet (kotsu)
  if (haipai[f] >= 3) {
    haipai[f] -= 3
    currentSets.push({ type: 'kotsu', tile: f })
    collectSets(haipai, currentSets, results)
    currentSets.pop()
    haipai[f] += 3
  }

  // Try sequence (shuntsu) — only for non-honor tiles within a suit (id < 27, value 0–6 within suit)
  if (f < 27 && f % 9 <= 6 && haipai[f + 1] > 0 && haipai[f + 2] > 0) {
    haipai[f] -= 1
    haipai[f + 1] -= 1
    haipai[f + 2] -= 1
    currentSets.push({ type: 'shuntsu', tiles: [f, f + 1, f + 2] })
    collectSets(haipai, currentSets, results)
    currentSets.pop()
    haipai[f] += 1
    haipai[f + 1] += 1
    haipai[f + 2] += 1
  }
}

/**
 * Find all valid standard-hand decompositions (4 sets + 1 pair) of the closed hand.
 * Returns array of { pair: int, sets: [...] }
 */
function findAllDecompositions(ints) {
  // Build haipai (tile count array)
  const haipai = new Array(34).fill(0)
  for (const id of ints) {
    haipai[id]++
  }

  const decompositions = []
  const seen = new Set()

  // Try each tile as the pair
  for (let i = 0; i < 34; i++) {
    if (haipai[i] < 2) continue

    haipai[i] -= 2
    const setResults = []
    collectSets(haipai, [], setResults)
    haipai[i] += 2

    for (const sets of setResults) {
      const key = JSON.stringify({ pair: i, sets })
      if (!seen.has(key)) {
        seen.add(key)
        decompositions.push({ pair: i, sets })
      }
    }
  }

  return decompositions
}

// ── Fu computation for a single decomposition ─────────────────────────────────

/**
 * Determine wait type and return the fu for it.
 * takenTile: the last tile (winning tile), as riichi-ts int
 * decomp: { pair, sets }
 */
function getWaitFu(takenTile, decomp) {
  const { pair, sets } = decomp

  // Tanki (pair wait)
  if (takenTile === pair) {
    return { type: 'tanki', fu: 2 }
  }

  for (const set of sets) {
    if (set.type === 'kotsu') {
      // Shanpon (dual-pair wait completes a triplet)
      if (takenTile === set.tile) {
        return { type: 'shanpon', fu: 0 }
      }
    } else {
      // shuntsu
      const [t0, t1, t2] = set.tiles
      if (takenTile === t1) {
        // Kanchan (middle tile of sequence)
        return { type: 'kanchan', fu: 2 }
      }
      if (takenTile === t0 || takenTile === t2) {
        // Check for penchan: sequence starts at value 0 (within suit) or ends at value 8
        const minTile = t0
        const maxTile = t2
        const isPenchan = (minTile % 9 === 0) || (maxTile % 9 === 8)
        if (isPenchan) {
          return { type: 'penchan', fu: 2 }
        }
        // Ryanmen (two-sided wait)
        return { type: 'ryanmen', fu: 0 }
      }
    }
  }

  // Fallback (should not happen for a valid hand)
  return { type: 'unknown', fu: 0 }
}

/**
 * Compute fu items for a single decomposition.
 */
function computeFuItems(decomp, takenTile, melds, opts) {
  const { isTsumo, bakaze, jikaze, yaku } = opts
  const { pair, sets } = decomp
  const items = []

  // Base fu
  items.push({ label: 'Base fu', fu: 20 })

  // Pair fu
  const isDragon = pair >= 31 && pair <= 33
  const isBakaze = pair === bakaze
  const isJikaze = pair === jikaze
  let pairFu = 0
  let pairLabel = `Pair (${tileShortName(pair)})`
  if (isDragon) {
    pairFu = 2
    pairLabel = `Dragon pair (${tileShortName(pair)})`
  } else if (isBakaze && isJikaze) {
    pairFu = 4
    pairLabel = `Double wind pair (${tileShortName(pair)})`
  } else if (isBakaze || isJikaze) {
    pairFu = 2
    pairLabel = `Wind pair (${tileShortName(pair)})`
  }
  if (pairFu > 0) {
    items.push({ label: pairLabel, fu: pairFu })
  }

  // Closed triplets from sets array
  for (const set of sets) {
    if (set.type === 'kotsu') {
      const isHT = isHonorOrTerminal(set.tile)
      const fu = isHT ? 8 : 4
      items.push({ label: `Triplet (${tileShortName(set.tile)})`, fu })
    }
  }

  // Open melds fu
  for (const meld of melds) {
    const meldTiles = meld.tiles
    if (meldTiles.length === 3) {
      // Pon or Chi
      const vals = meldTiles.map((t) => tileToRiichi(t))
      const allSame = vals.every((v) => v === vals[0])
      if (allSame) {
        // Pon
        const isHT = isHonorOrTerminal(vals[0])
        const fu = isHT ? 4 : 2
        items.push({ label: `Open pon (${tileShortName(vals[0])})`, fu })
      }
      // Chi = 0 fu, don't add
    } else if (meldTiles.length === 4) {
      // Kan
      const vals = meldTiles.map((t) => tileToRiichi(t))
      const isHT = isHonorOrTerminal(vals[0])
      if (meld.open) {
        const fu = isHT ? 16 : 8
        items.push({ label: `Open kan (${tileShortName(vals[0])})`, fu })
      } else {
        const fu = isHT ? 32 : 16
        items.push({ label: `Closed kan (${tileShortName(vals[0])})`, fu })
      }
    }
  }

  // Wait type fu
  const wait = getWaitFu(takenTile, decomp)
  if (wait.fu > 0) {
    const waitLabels = {
      tanki: 'Tanki wait',
      kanchan: 'Kanchan wait',
      penchan: 'Penchan wait',
    }
    items.push({ label: waitLabels[wait.type] ?? wait.type, fu: wait.fu })
  }

  // Tsumo bonus
  const hasPinfu = 'pinfu' in yaku
  if (isTsumo && !hasPinfu) {
    items.push({ label: 'Tsumo', fu: 2 })
  }

  return items
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Given a 13-tile tenpai hand and a winning tile integer, return all wait types
 * that tile satisfies (e.g. ['ryanmen'], ['tanki'], ['shanpon', 'ryanmen']).
 *
 * @param {TileObject[]} tiles13    — 13-tile tenpai hand
 * @param {number}       waitTileInt — riichi-ts int for the winning tile
 * @returns {string[]}
 */
export function getWaitTypes(tiles13, waitTileInt) {
  const ints = [...tiles13.map((t) => tileToRiichi(t)), waitTileInt].sort((a, b) => a - b)
  const decompositions = findAllDecompositions(ints)
  const types = new Set()
  for (const decomp of decompositions) {
    const info = getWaitFu(waitTileInt, decomp)
    if (info.type !== 'unknown') types.add(info.type)
  }
  return [...types]
}

/**
 * Calculate fu breakdown for a winning hand.
 *
 * @param {TileObject[]} tiles     — all hand tiles (13 or 14)
 * @param {object[]}     melds     — [{ open: boolean, tiles: TileObject[] }]
 * @param {object}       opts
 * @param {boolean}      opts.isTsumo
 * @param {TileObject}   opts.wonTile  — explicit winning tile (for ron; if omitted, uses last sorted tile)
 * @param {number}       opts.bakaze   — riichi-ts int for round wind (default 27=East)
 * @param {number}       opts.jikaze   — riichi-ts int for seat wind  (default 27=East)
 * @param {object}       opts.yaku     — { yakuName: han }
 *
 * @returns {{ items: {label:string,fu:number}[], fu: number } | null}
 */
export function getFuBreakdown(tiles, melds = [], opts = {}) {
  const { isTsumo = false, wonTile = null, bakaze = 27, jikaze = 27, yaku = {} } = opts

  if (!tiles || tiles.length === 0) return null

  // Special case: chiitoitsu is always 25 fu
  if ('chiitoitsu' in yaku) {
    return { items: [{ label: 'Chiitoitsu', fu: 25 }], fu: 25 }
  }

  // Convert tiles to sorted riichi-ts integers
  const ints = tiles.map((t) => tileToRiichi(t)).sort((a, b) => a - b)
  // For tsumo: last sorted tile is the drawn tile.
  // For ron: caller passes wonTile explicitly (last in input order, which may not be last sorted).
  const takenTile = wonTile ? tileToRiichi(wonTile) : ints[ints.length - 1]

  // Find all valid decompositions
  const decompositions = findAllDecompositions(ints)
  if (decompositions.length === 0) return null

  // Compute fu for each decomposition, keep the highest
  let best = null
  let bestRaw = -1

  for (const decomp of decompositions) {
    const items = computeFuItems(decomp, takenTile, melds, { isTsumo, bakaze, jikaze, yaku })
    const rawFu = items.reduce((s, item) => s + item.fu, 0)
    // Round up to nearest 10, minimum 30
    const roundedFu = Math.max(30, Math.ceil(rawFu / 10) * 10)

    if (roundedFu > bestRaw || (roundedFu === bestRaw && best === null)) {
      bestRaw = roundedFu
      best = { items, rawFu, fu: roundedFu }
    }
  }

  if (!best) return null

  return { items: best.items, rawFu: best.rawFu, fu: best.fu }
}
