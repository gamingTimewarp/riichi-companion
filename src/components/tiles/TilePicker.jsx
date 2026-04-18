import { PICKER_ROWS } from '../../lib/tiles.js'
import TileDisplay from './TileDisplay.jsx'

const SUIT_LABEL = { m: 'Man', p: 'Pin', s: 'Sou', z: 'Honor', f: 'Extra Tiles' }
const SUIT_LABEL_COLOR = {
  m: 'text-rose-400',
  p: 'text-sky-400',
  s: 'text-emerald-400',
  z: 'text-violet-400',
  f: 'text-amber-400',
}

/**
 * Visual 34-tile grid for hand input.
 *
 * Props:
 *   tiles   — TileObject[] currently in hand (from handStore)
 *   onAdd   — (tile) => void — add tile to hand
 *   maxTiles — max hand size (default 14)
 */
export default function TilePicker({ tiles, onAdd, maxTiles = 14, allowAka = true, redFives = { m: 1, p: 1, s: 1 }, otherHandTiles = [] }) {
  const handFull = tiles.length >= maxTiles

  // Count of each (suit+value+isAka) combination in this hand only
  function countInHand(suit, value, isAka) {
    return tiles.filter(
      (t) => t.suit === suit && t.value === value && t.isAka === isAka
    ).length
  }

  // Total copies across this hand AND other winner hands (enforces the 4-copy pool)
  function totalCopiesInHand(suit, value) {
    const local = tiles.filter((t) => t.suit === suit && t.value === value).length
    const others = otherHandTiles.filter((t) => t.suit === suit && t.value === value).length
    return local + others
  }

  function isDisabled(tile) {
    if (handFull) return true
    if (tile.suit === 'f') {
      // Each extra tile exists only once in the set
      return totalCopiesInHand(tile.suit, tile.value) >= 1
    }
    if (tile.isAka) {
      if (!allowAka) return true
      // Only 1 aka per suit; also constrained by total 4-of-a-kind
      const suitLimit = redFives?.[tile.suit] ?? 0
      return countInHand(tile.suit, tile.value, true) >= suitLimit || totalCopiesInHand(tile.suit, tile.value) >= 4
    }
    return totalCopiesInHand(tile.suit, tile.value) >= 4
  }

  return (
    <div className="flex flex-col gap-2">
      {PICKER_ROWS.map((row) => (
        <div key={row.suit} className="flex flex-col gap-1">
          <span className={`text-xs font-semibold ${SUIT_LABEL_COLOR[row.suit]}`}>
            {SUIT_LABEL[row.suit]}
          </span>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${row.tiles.length}, minmax(0, 1fr))` }}
          >
            {row.tiles.map((tile, i) => {
              const inHand = tile.isAka
                ? countInHand(tile.suit, tile.value, true)
                : countInHand(tile.suit, tile.value, false)
              const disabled = isDisabled(tile)

              return (
                <TileDisplay
                  key={`${tile.suit}${tile.isAka ? '0' : tile.value}-${i}`}
                  tile={tile}
                  size="sm"
                  count={inHand}
                  disabled={disabled}
                  onClick={() => !disabled && onAdd(tile)}
                />
              )
            })}
          </div>
        </div>
      ))}
      <p className="text-xs text-slate-500 text-center mt-1">
        Tap a tile to add it · {maxTiles - tiles.length} slot{maxTiles - tiles.length !== 1 ? 's' : ''} remaining
      </p>
    </div>
  )
}
