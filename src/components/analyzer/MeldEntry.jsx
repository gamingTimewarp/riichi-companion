import { tileToUnicode } from '../../lib/tiles.js'

const SUIT_COLOR = {
  m: 'text-rose-300',
  p: 'text-sky-300',
  s: 'text-emerald-300',
  z: 'text-violet-300',
}

const SUIT_LABEL_COLOR = {
  m: 'text-rose-400', p: 'text-sky-400', s: 'text-emerald-400', z: 'text-violet-400',
}

// ── Meld type detection helpers ───────────────────────────────────────────────

function areSameTile(tiles) {
  if (tiles.length === 0) return false
  return tiles.every((t) => t.suit === tiles[0].suit && t.value === tiles[0].value)
}

function isChiTiles(tiles) {
  if (tiles.length !== 3) return false
  if (tiles.some((t) => t.suit === 'z')) return false
  if (!tiles.every((t) => t.suit === tiles[0].suit)) return false
  const vals = tiles.map((t) => t.value).sort((a, b) => a - b)
  return vals[1] === vals[0] + 1 && vals[2] === vals[1] + 1
}

/**
 * Returns list of valid meld types for the given pendingTiles.
 * Each entry: { type: 'pon'|'chi'|'ankan'|'openkan'|'nukidora', label: string }
 */
function detectValidMelds(pendingTiles) {
  const valid = []
  if (pendingTiles.length === 1) {
    const t = pendingTiles[0]
    if (t.suit === 'z' && t.value === 4) {
      valid.push({ type: 'nukidora', label: 'Nukidora (北抜き)' })
    } else if (t.suit === 'f') {
      valid.push({ type: 'extradora', label: 'Extra Dora (花牌)' })
    }
  } else if (pendingTiles.length === 3) {
    if (areSameTile(pendingTiles)) {
      valid.push({ type: 'pon', label: 'Pon (open triplet)' })
      valid.push({ type: 'openkan', label: 'Open Kan (add 4th copy)' })
    }
    if (isChiTiles(pendingTiles)) {
      valid.push({ type: 'chi', label: 'Chi (sequence)' })
    }
  } else if (pendingTiles.length === 4) {
    if (areSameTile(pendingTiles)) {
      valid.push({ type: 'ankan', label: 'Ankan (closed kan)' })
    }
  }
  return valid
}

// ── MeldManager ───────────────────────────────────────────────────────────────

/**
 * Manages declared melds and meld selection workflow.
 *
 * Props:
 *   melds           — current melds array
 *   onRemove        — (index) => void
 *   onStartSelect   — () => void   (tells parent to enter select mode)
 *   pendingTiles    — TileObject[] (the currently selected tiles, in selection order)
 *   onConfirmMeld   — ({open: boolean, tiles: TileObject[]}) => void
 *   onCancelSelect  — () => void
 *   isSelecting     — boolean
 */
export default function MeldEntry({
  melds,
  onRemove,
  onStartSelect,
  pendingTiles = [],
  onConfirmMeld,
  onCancelSelect,
  isSelecting = false,
  allowNukidora = true,
}) {
  const validMelds = detectValidMelds(pendingTiles).filter(
    (m) => m.type !== 'nukidora' || allowNukidora,
  )

  function handleConfirm(meldType) {
    if (meldType === 'nukidora' || meldType === 'extradora') {
      onConfirmMeld?.({ type: meldType, open: false, tiles: pendingTiles })
      return
    }

    let tiles = pendingTiles
    let open = true

    if (meldType === 'openkan') {
      // Auto-add one more copy of the same tile
      tiles = [...pendingTiles, { ...pendingTiles[0] }]
    } else if (meldType === 'ankan') {
      open = false
    }

    onConfirmMeld?.({ open, tiles })
  }

  return (
    <div className="flex flex-col gap-2">

      {/* Declared melds */}
      {melds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {melds.map((meld, i) => (
            <div
              key={i}
              className="flex items-center gap-1 rounded border border-slate-600 bg-slate-800 px-2 py-1"
            >
              <span className="text-xs text-slate-500 mr-0.5">{meld.open ? 'Open' : 'Ankan'}</span>
              {meld.tiles.map((t, j) => (
                <span key={j} className={`text-lg leading-none ${SUIT_LABEL_COLOR[t.suit]}`}>
                  {tileToUnicode(t)}
                </span>
              ))}
              <button
                onClick={() => onRemove?.(i)}
                className="ml-1 text-slate-600 hover:text-rose-400 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {!isSelecting && (
        <button
          onClick={onStartSelect}
          className="self-start text-xs px-3 py-1 rounded border border-dashed border-slate-600 text-slate-500 hover:border-slate-400 hover:text-slate-300 transition-colors"
        >
          + Declare Meld
        </button>
      )}

      {isSelecting && (
        <div className="rounded-lg border border-amber-700 bg-amber-900/20 p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">Selecting tiles for meld…</span>
            <button
              onClick={onCancelSelect}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Selected tiles preview */}
          {pendingTiles.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {pendingTiles.map((t, i) => (
                <span key={i} className={`text-2xl leading-none ${SUIT_COLOR[t.suit]}`}>
                  {tileToUnicode(t)}
                </span>
              ))}
            </div>
          )}

          {/* Valid meld buttons */}
          {validMelds.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {validMelds.map((m) => (
                <button
                  key={m.type}
                  onClick={() => handleConfirm(m.type)}
                  className="px-3 py-1 rounded border border-sky-600 bg-sky-900/40 text-sky-300 text-xs font-medium hover:bg-sky-800/60 transition-colors"
                >
                  {m.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              {pendingTiles.length === 0
                ? 'Tap tiles in your hand to select them for a meld.'
                : 'Select 3 identical tiles (pon/kan), 3 consecutive same-suit (chi), or 4 identical (ankan)'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
