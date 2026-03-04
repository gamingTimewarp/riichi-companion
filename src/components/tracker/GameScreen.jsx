import { useState } from 'react'
import useGameStore from '../../stores/gameStore'
import { getRoundName, getSeatWindName, shouldGameEnd } from '../../lib/scoring'

const WIND_CHARS = { East: '東', South: '南', West: '西', North: '北' }

const RETURN = 30000

function formatScore(score, relative) {
  if (!relative) return score.toLocaleString()
  const diff = score - RETURN
  const sign = diff >= 0 ? '+' : ''
  // Show in thousands with one decimal if non-zero fractional part
  const k = diff / 1000
  return `${sign}${Number.isInteger(k) ? k : k.toFixed(1)}k`
}

function ScoreRow({ player, seatWind, hasRiichi, onToggleRiichi, relative }) {
  const diff = player.score - RETURN
  const isNeg = diff < 0
  return (
    <div
      className={`flex items-center gap-3 py-3 border-b border-slate-700 last:border-0 cursor-pointer select-none transition-colors ${hasRiichi ? 'bg-yellow-900/10' : 'hover:bg-slate-700/30'}`}
      onClick={onToggleRiichi}
      title="Tap to toggle riichi"
    >
      <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${hasRiichi ? 'bg-yellow-700 text-white' : 'bg-slate-700 text-slate-200'}`}>
        {WIND_CHARS[seatWind]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-slate-100 font-medium truncate">{player.name}</div>
      </div>
      {hasRiichi && (
        <span className="text-yellow-400 text-xs font-bold tracking-wide">立直</span>
      )}
      <div className={`text-lg font-bold tabular-nums ${relative ? (isNeg ? 'text-red-400' : diff > 0 ? 'text-green-400' : 'text-slate-400') : (player.score < 0 ? 'text-red-400' : 'text-slate-100')}`}>
        {formatScore(player.score, relative)}
      </div>
    </div>
  )
}

// #1: accepts players array to show names instead of P1/P2/P3/P4
function LogEntry({ entry, players, isLast, onUndo }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-slate-800 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-slate-300 text-sm">{entry.label}</div>
        {entry.deltas && (
          <div className="flex gap-2 mt-1 flex-wrap">
            {entry.deltas.map((d, i) => d !== 0 && (
              <span key={i} className={`text-xs font-mono ${d > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {players?.[i]?.name ?? `P${i + 1}`} {d > 0 ? '+' : ''}{d.toLocaleString()}
              </span>
            ))}
          </div>
        )}
      </div>
      {isLast && (
        <button
          onClick={onUndo}
          className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded border border-rose-800 hover:border-rose-600 transition-colors shrink-0"
        >
          Undo
        </button>
      )}
    </div>
  )
}

export default function GameScreen({ onHandEntry, onDrawEntry, onNagashi, onChombo, onWallDice, onEndGame, riichiFlags, onToggleRiichi }) {
  const { players, dealer, round, honba, riichiPool, log, gameType, entryMode, undoLastEntry, setEntryMode } = useGameStore()
  const [logOpen, setLogOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [relativeScore, setRelativeScore] = useState(false)

  const gameOver = shouldGameEnd(round, gameType)

  return (
    <div className="px-4 py-4 space-y-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="bg-sky-800 text-sky-200 text-sm font-bold px-3 py-1 rounded-full">
          {getRoundName(round)}
        </span>
        {honba > 0 && (
          <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-full">
            {honba} honba
          </span>
        )}
        {riichiPool > 0 && (
          <span className="bg-yellow-900 text-yellow-300 text-xs px-2 py-1 rounded-full">
            Pool: {(riichiPool * 1000).toLocaleString()}
          </span>
        )}
        <span className="ml-auto text-slate-500 text-xs">{gameType === 'hanchan' ? 'Hanchan' : 'Tonpuusen'}</span>
      </div>

      {/* Scoreboard — tap a row to toggle riichi */}
      <div className="bg-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-2 pb-1">
          <span className="text-xs text-slate-500">Scores</span>
          <button
            onClick={() => setRelativeScore((v) => !v)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {relativeScore ? 'Showing ±30k' : 'Showing absolute'} · switch
          </button>
        </div>
        <div className="px-4 divide-y divide-slate-700">
          {players.map((p, i) => (
            <ScoreRow
              key={i}
              player={p}
              seatWind={getSeatWindName(i, dealer)}
              hasRiichi={riichiFlags?.[i] ?? false}
              onToggleRiichi={() => onToggleRiichi?.(i)}
              relative={relativeScore}
            />
          ))}
        </div>
      </div>
      <p className="text-[11px] text-slate-700 -mt-2 text-center">Tap a row to mark/unmark riichi</p>

      {/* #5: Primary action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onHandEntry}
          disabled={gameOver}
          className="py-4 bg-sky-700 hover:bg-sky-600 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors"
        >
          Record Hand
        </button>
        <button
          onClick={onDrawEntry}
          disabled={gameOver}
          className="py-4 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-100 font-semibold rounded-xl transition-colors"
        >
          Draw
        </button>
      </div>

      {/* Nagashi — secondary but distinct */}
      <button
        onClick={onNagashi}
        disabled={gameOver}
        className="w-full py-3 bg-teal-900 hover:bg-teal-800 disabled:opacity-40 border border-teal-700 text-teal-300 text-sm font-medium rounded-xl transition-colors"
      >
        Nagashi Mangan
      </button>

      {/* #5: More actions (collapsible) */}
      <div className="rounded-xl border border-slate-700 overflow-hidden">
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>More actions</span>
          <span>{moreOpen ? '▲' : '▼'}</span>
        </button>
        {moreOpen && (
          <div className="grid grid-cols-3 gap-2 px-3 pb-3">
            <button
              onClick={onChombo}
              className="py-2.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-400 text-xs font-medium rounded-lg transition-colors"
            >
              Chombo
            </button>
            <button
              onClick={onWallDice}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs font-medium rounded-lg transition-colors"
            >
              Wall Dice
            </button>
            <button
              onClick={() => setEntryMode(entryMode === 'detailed' ? 'quick' : 'detailed')}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs font-medium rounded-lg transition-colors"
            >
              {entryMode === 'detailed' ? 'Detailed' : 'Quick'}
            </button>
          </div>
        )}
      </div>

      {/* End game: auto-shown when done; early-end option always available */}
      {gameOver ? (
        <button
          onClick={onEndGame}
          className="w-full py-3 bg-violet-700 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors"
        >
          View Final Results
        </button>
      ) : confirmEnd ? (
        // #3: confirmation step
        <div className="rounded-xl border border-amber-700 bg-amber-900/20 p-3 space-y-2">
          <p className="text-amber-300 text-sm font-medium">End the game early?</p>
          <p className="text-amber-400/70 text-xs">Uma and final scores will be calculated from current totals.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmEnd(false)}
              className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm transition-colors hover:border-slate-400"
            >
              Cancel
            </button>
            <button
              onClick={onEndGame}
              className="flex-1 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
            >
              End Game
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmEnd(true)}
          className="w-full py-2 text-slate-500 hover:text-slate-300 text-xs border border-slate-800 hover:border-slate-600 rounded-xl transition-colors"
        >
          End game early…
        </button>
      )}

      {/* Hand log */}
      <div className="bg-slate-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setLogOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-300"
        >
          <span>Hand Log ({log.length})</span>
          <span>{logOpen ? '▲' : '▼'}</span>
        </button>
        {logOpen && (
          <div className="px-4 pb-2 max-h-64 overflow-y-auto">
            {log.length === 0 ? (
              <p className="text-slate-500 text-sm py-2">No hands recorded yet.</p>
            ) : (
              [...log].reverse().map((entry, i) => (
                <LogEntry
                  key={i}
                  entry={entry}
                  players={players}
                  isLast={i === 0}
                  onUndo={i === 0 ? undoLastEntry : undefined}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
