import TileDisplay from '../tiles/TileDisplay.jsx'

/**
 * Shows the tiles currently in hand.
 *
 * Props:
 *   tiles          — TileObject[]
 *   onRemove       — (index) => void  (used when NOT in select mode)
 *   onClear        — () => void
 *   selectMode     — boolean (when true, tiles are selectable instead of removable)
 *   selectedIndices — Set<number>   (indices of selected tiles)
 *   onToggleSelect — (index) => void (called when a tile is clicked in select mode)
 *   maxTiles       — number (optional, defaults to 14)
 */
export default function HandDisplay({
  tiles,
  onRemove,
  onClear,
  selectMode = false,
  selectedIndices = new Set(),
  onToggleSelect,
  maxTiles = 14,
}) {
  const count = tiles.length
  const isEmpty = count === 0
  const selectedCount = selectedIndices.size

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">
          {selectMode ? (
            <>
              Hand&nbsp;
              <span className="text-amber-300">{selectedCount} selected</span>
            </>
          ) : (
            <>
              Hand&nbsp;
              <span className={count === maxTiles ? 'text-sky-400' : 'text-slate-300'}>
                ({count}/{maxTiles})
              </span>
            </>
          )}
        </span>
        {!isEmpty && !selectMode && (
          <button
            onClick={onClear}
            className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="h-12 flex items-center justify-center rounded border border-dashed border-slate-700 text-slate-600 text-sm">
          No tiles — tap the picker or type notation below
        </div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {tiles.map((tile, i) => {
            const isSelected = selectedIndices.has(i)
            return (
              <TileDisplay
                key={i}
                tile={tile}
                size="md"
                onClick={selectMode ? () => onToggleSelect?.(i) : () => onRemove?.(i)}
                title={selectMode ? (isSelected ? 'Deselect tile' : 'Select tile') : `Remove tile ${i + 1}`}
                className={isSelected ? 'ring-2 ring-white brightness-125' : ''}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
