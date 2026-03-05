/**
 * DiscardTracker — per-player discard pile entry for the Hand Analyser.
 *
 * Tracks up to 4 players' discards. Player 0 = "You" (the hand being analysed).
 * Computes:
 *   - Furiten: any of "Your" wait tiles appear in your own discard pile
 *   - Nagashi Mangan eligibility: all discards are terminals/honors AND no discard was claimed
 */

import { useState } from 'react'
import useHandStore from '../../stores/handStore.js'
import { TILE_TYPES, tileToUnicode, tileToRiichi, isTerminalOrHonor } from '../../lib/tiles.js'

const SUIT_COLOR = { m: 'text-rose-300', p: 'text-sky-300', s: 'text-emerald-300', z: 'text-violet-300' }
const TILE_ROWS = ['m', 'p', 's', 'z'].map((suit) => ({
  suit,
  tiles: TILE_TYPES.filter((t) => t.suit === suit),
}))

const PLAYER_LABELS = ['You', 'P2', 'P3', 'P4']

function nagashiStatus(tiles, anyClaimed) {
  if (tiles.length === 0) return null // nothing discarded yet — not applicable
  if (anyClaimed) return 'claimed'
  if (tiles.every(isTerminalOrHonor)) return 'possible'
  return 'broken'
}

const NAGASHI_BADGE = {
  possible: { text: 'Nagashi possible', cls: 'text-teal-400 bg-teal-900/30 border-teal-800' },
  broken:   { text: 'Non-terminal discarded', cls: 'text-slate-500 bg-slate-800/40 border-slate-700' },
  claimed:  { text: 'Discard claimed', cls: 'text-slate-500 bg-slate-800/40 border-slate-700' },
}

// ── Tile picker (DoraSelector-style) ─────────────────────────────────────────

function TilePicker({ onPick, onCancel }) {
  return (
    <div className="flex flex-col gap-1 p-2 rounded border border-slate-700 bg-slate-900/80 mt-1">
      {TILE_ROWS.map((row) => (
        <div key={row.suit} className="flex flex-wrap gap-0.5">
          {row.tiles.map((t, i) => (
            <button
              key={i}
              onClick={() => onPick(t)}
              className={`text-xl leading-none px-0.5 py-0.5 rounded hover:bg-slate-700 transition-colors ${SUIT_COLOR[t.suit]}`}
            >
              {tileToUnicode(t)}
            </button>
          ))}
        </div>
      ))}
      <button
        onClick={onCancel}
        className="mt-1 text-xs text-slate-500 hover:text-slate-300 text-left"
      >
        cancel
      </button>
    </div>
  )
}

// ── Player row ────────────────────────────────────────────────────────────────

function PlayerRow({ playerIdx, data, waits, open, onToggleOpen }) {
  const { addDiscard, removeDiscard, setAnyClaimed } = useHandStore()
  const { tiles, anyClaimed } = data
  const label = PLAYER_LABELS[playerIdx]

  // Furiten: only relevant for "You" (player 0) when there are waits
  const furitenTiles = playerIdx === 0 && waits.length > 0
    ? tiles.filter((t) => waits.includes(tileToRiichi(t)))
    : []
  const isFuriten = furitenTiles.length > 0

  const status = nagashiStatus(tiles, anyClaimed)
  const badge = status ? NAGASHI_BADGE[status] : null

  return (
    <div className={`rounded-xl border px-3 py-2 space-y-2 transition-colors ${
      isFuriten ? 'border-rose-800 bg-rose-900/10' : 'border-slate-700 bg-slate-800/40'
    }`}>
      {/* Header row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-bold w-7 shrink-0 ${playerIdx === 0 ? 'text-sky-400' : 'text-slate-400'}`}>
          {label}
        </span>

        {/* Discard tiles */}
        <div className="flex flex-wrap gap-0.5 flex-1 min-w-0">
          {tiles.map((t, ti) => (
            <button
              key={ti}
              onClick={() => removeDiscard(playerIdx, ti)}
              title="Remove discard"
              className={`text-base leading-none px-0.5 rounded hover:bg-rose-900/40 transition-colors ${
                playerIdx === 0 && waits.includes(tileToRiichi(t))
                  ? 'text-rose-400 ring-1 ring-rose-600 rounded'
                  : SUIT_COLOR[t.suit]
              }`}
            >
              {tileToUnicode(t)}
            </button>
          ))}
          {tiles.length === 0 && (
            <span className="text-xs text-slate-600 italic">none</span>
          )}
        </div>

        {/* Furiten badge */}
        {isFuriten && (
          <span className="text-[10px] font-bold text-rose-400 bg-rose-900/40 border border-rose-800 px-1.5 py-0.5 rounded shrink-0">
            FURITEN
          </span>
        )}

        {/* Add button */}
        <button
          onClick={onToggleOpen}
          className="text-xs text-slate-500 hover:text-slate-200 border border-slate-700 hover:border-slate-500 px-1.5 py-0.5 rounded transition-colors shrink-0"
        >
          {open ? '−' : '+ discard'}
        </button>
      </div>

      {/* Tile picker */}
      {open && (
        <TilePicker
          onPick={(t) => { addDiscard(playerIdx, t); onToggleOpen() }}
          onCancel={onToggleOpen}
        />
      )}

      {/* Footer: nagashi + claimed toggle */}
      {(tiles.length > 0 || badge) && (
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          {badge && (
            <span className={`text-[10px] border px-1.5 py-0.5 rounded ${badge.cls}`}>
              {badge.text}
            </span>
          )}
          <button
            onClick={() => setAnyClaimed(playerIdx, !anyClaimed)}
            className={`text-[10px] border px-1.5 py-0.5 rounded transition-colors ml-auto ${
              anyClaimed
                ? 'text-amber-400 bg-amber-900/30 border-amber-700'
                : 'text-slate-600 border-slate-700 hover:border-slate-500'
            }`}
          >
            {anyClaimed ? 'Claimed ✓' : 'Mark claimed'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DiscardTracker({ waits = [], numPlayers = 4 }) {
  const { playerDiscards } = useHandStore()
  const [openFor, setOpenFor] = useState(null) // playerIdx with picker open, or null

  function toggleOpen(i) {
    setOpenFor((prev) => (prev === i ? null : i))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Discards</span>
        <span className="text-[10px] text-slate-600">Tap tile to remove · furiten + nagashi detection</span>
      </div>
      {playerDiscards.slice(0, numPlayers).map((data, i) => (
        <PlayerRow
          key={i}
          playerIdx={i}
          data={data}
          waits={waits}
          open={openFor === i}
          onToggleOpen={() => toggleOpen(i)}
        />
      ))}
    </div>
  )
}
