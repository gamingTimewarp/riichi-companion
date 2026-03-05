/**
 * Tile system for Riichi Mahjong.
 *
 * Notation: values 1–9 followed by suit letter.
 *   Suits: m (man/characters), p (pin/circles), s (sou/bamboo), z (honors)
 *   Prefix '0' means red five (aka dora): 0m, 0p, 0s
 *   Honors (z): 1=East, 2=South, 3=West, 4=North, 5=Haku, 6=Hatsu, 7=Chun
 *
 * Example strings: "123m456p789s1122z" or "0m23m" (red 5-man)
 */

// Riichi-ts integer mapping:
//   Man  (m): 0–8  (value 1 = index 0)
//   Pin  (p): 9–17 (value 1 = index 9)
//   Sou  (s): 18–26 (value 1 = index 18)
//   Honors (z): 27–33 (1z=27 ... 7z=33)

export const SUITS = ['m', 'p', 's', 'z']

export const SUIT_NAMES = {
  m: 'Man',
  p: 'Pin',
  s: 'Sou',
  z: 'Honor',
}

const HONOR_NAMES = ['', 'East', 'South', 'West', 'North', 'Haku', 'Hatsu', 'Chun']

// All 34 unique tile definitions (ignoring aka)
export const TILE_TYPES = [
  ...Array.from({ length: 9 }, (_, i) => ({ suit: 'm', value: i + 1, isAka: false })),
  ...Array.from({ length: 9 }, (_, i) => ({ suit: 'p', value: i + 1, isAka: false })),
  ...Array.from({ length: 9 }, (_, i) => ({ suit: 's', value: i + 1, isAka: false })),
  ...Array.from({ length: 7 }, (_, i) => ({ suit: 'z', value: i + 1, isAka: false })),
]

/**
 * Returns true for terminals (1 or 9 of m/p/s) and all honor tiles (z).
 * Used for Nagashi Mangan eligibility checks.
 */
export function isTerminalOrHonor(tile) {
  if (tile.suit === 'z') return true
  const v = tile.value === 0 ? 5 : tile.value
  return v === 1 || v === 9
}

/**
 * Convert a tile object to its riichi-ts integer.
 * Aka dora (red 5) maps to the same integer as a regular 5 — riichi-ts handles
 * aka separately via its akadora option.
 */
export function tileToRiichi(tile) {
  const v = tile.value === 0 ? 5 : tile.value
  switch (tile.suit) {
    case 'm': return v - 1
    case 'p': return 9 + (v - 1)
    case 's': return 18 + (v - 1)
    case 'z': return 27 + (v - 1)
    default: throw new Error(`Unknown suit: ${tile.suit}`)
  }
}

/**
 * Convert a tile object back to its notation string.
 */
export function tileToString(tile) {
  const v = tile.isAka ? '0' : String(tile.value)
  return v + tile.suit
}

/**
 * Human-readable tile label (e.g. "5m", "East", "Red 5p").
 */
export function tileLabel(tile) {
  if (tile.suit === 'z') return HONOR_NAMES[tile.value]
  if (tile.isAka) return `Red 5${tile.suit}`
  return `${tile.value}${tile.suit}`
}

/**
 * Parse a notation string into an array of tile objects.
 *
 * Returns: { tiles: TileObject[], errors: string[] }
 *
 * Each TileObject: { suit: string, value: number, isAka: boolean, index: number }
 * `index` is the character position in the source string (for error highlighting).
 */
export function parseNotation(str) {
  if (!str || str.trim() === '') return { tiles: [], errors: [] }

  const tiles = []
  const errors = []

  // Collect pending digit tokens and their positions
  let pending = [] // [{ char, pos }]
  let i = 0

  while (i < str.length) {
    const ch = str[i]

    if (SUITS.includes(ch)) {
      if (pending.length === 0) {
        errors.push(`Unexpected suit '${ch}' at position ${i} with no preceding values`)
        i++
        continue
      }

      for (const { char, pos } of pending) {
        const raw = parseInt(char, 10)
        if (isNaN(raw)) {
          errors.push(`Invalid character '${char}' at position ${pos}`)
          continue
        }

        const isAka = raw === 0
        const value = isAka ? 5 : raw

        if (ch === 'z') {
          if (value < 1 || value > 7) {
            errors.push(`Invalid honor tile value ${value} at position ${pos}`)
            continue
          }
          if (isAka) {
            errors.push(`Aka dora not valid for honors at position ${pos}`)
            continue
          }
        } else {
          if (value < 1 || value > 9) {
            errors.push(`Invalid tile value ${value} at position ${pos}`)
            continue
          }
        }

        tiles.push({ suit: ch, value, isAka, pos })
      }
      pending = []
    } else if (/\d/.test(ch)) {
      pending.push({ char: ch, pos: i })
    } else if (ch === ' ') {
      // ignore spaces
    } else {
      errors.push(`Unknown character '${ch}' at position ${i}`)
    }

    i++
  }

  if (pending.length > 0) {
    errors.push(`Trailing digits '${pending.map(p => p.char).join('')}' with no suit`)
  }

  return { tiles, errors }
}

/**
 * Convert an array of tile objects to a sorted notation string.
 * Groups by suit order: m, p, s, z.
 */
export function tilesToNotation(tiles) {
  const groups = { m: [], p: [], s: [], z: [] }
  for (const t of tiles) {
    groups[t.suit].push(t)
  }
  let result = ''
  for (const suit of SUITS) {
    const group = groups[suit]
    if (group.length === 0) continue
    group.sort((a, b) => a.value - b.value)
    result += group.map(t => (t.isAka ? '0' : String(t.value))).join('') + suit
  }
  return result
}

/**
 * Convert tile objects to the integer array riichi-ts expects.
 * Returns sorted array of integers.
 */
export function tilesToRiichiInts(tiles) {
  return tiles.map(tileToRiichi).sort((a, b) => a - b)
}

/**
 * Convert a tile object to its Unicode mahjong character.
 * Unicode mahjong block U+1F000–U+1F02B.
 */
export function tileToUnicode(tile) {
  const v = tile.value // 1–9 (aka already maps to value=5)
  if (tile.suit === 'm') return String.fromCodePoint(0x1F007 + (v - 1))
  if (tile.suit === 'p') return String.fromCodePoint(0x1F019 + (v - 1))
  if (tile.suit === 's') return String.fromCodePoint(0x1F010 + (v - 1))
  // Honors: 1z=East 2z=South 3z=West 4z=North 5z=Haku 6z=Hatsu 7z=Chun
  const zCodes = [0x1F000, 0x1F001, 0x1F002, 0x1F003, 0x1F006, 0x1F005, 0x1F004]
  return String.fromCodePoint(zCodes[v - 1])
}

/**
 * Given a riichi-ts integer tile id, return a minimal tile object.
 */
export function riichiIntToTile(id) {
  if (id <= 8) return { suit: 'm', value: id + 1, isAka: false }
  if (id <= 17) return { suit: 'p', value: id - 8, isAka: false }
  if (id <= 26) return { suit: 's', value: id - 17, isAka: false }
  return { suit: 'z', value: id - 26, isAka: false }
}

/**
 * Given a dora indicator TileObject, return the riichi-ts integer for the actual dora tile.
 * Sequences: numbered 1→2→…→9→1, winds E→S→W→N→E, dragons Haku→Hatsu→Chun→Haku.
 */
export function indicatorToDoraInt(tile) {
  if (tile.suit === 'z') {
    if (tile.value <= 4) {
      // Winds: East(1)→South(2)→West(3)→North(4)→East(1)
      return 27 + (tile.value % 4)
    } else {
      // Dragons: Haku(5)→Hatsu(6)→Chun(7)→Haku(5)
      return 31 + ((tile.value - 5 + 1) % 3)
    }
  }
  // Numbered: 1→2, …, 8→9, 9→1
  const nextVal = tile.value === 9 ? 1 : tile.value + 1
  return tileToRiichi({ suit: tile.suit, value: nextVal, isAka: false })
}

/**
 * All picker rows: number suits include aka-5 at end, honors are separate.
 */
export const PICKER_ROWS = [
  {
    suit: 'm',
    tiles: [
      ...Array.from({ length: 9 }, (_, i) => ({ suit: 'm', value: i + 1, isAka: false })),
      { suit: 'm', value: 5, isAka: true },
    ],
  },
  {
    suit: 'p',
    tiles: [
      ...Array.from({ length: 9 }, (_, i) => ({ suit: 'p', value: i + 1, isAka: false })),
      { suit: 'p', value: 5, isAka: true },
    ],
  },
  {
    suit: 's',
    tiles: [
      ...Array.from({ length: 9 }, (_, i) => ({ suit: 's', value: i + 1, isAka: false })),
      { suit: 's', value: 5, isAka: true },
    ],
  },
  {
    suit: 'z',
    tiles: Array.from({ length: 7 }, (_, i) => ({ suit: 'z', value: i + 1, isAka: false })),
  },
]
