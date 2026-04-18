import { useState } from 'react'
import useHistoryStore from '../../stores/historyStore'
import { calculateFinalScores } from '../../lib/scoring'
import { generateSummaryText } from '../../lib/gameSummary'

const PLACEMENT_LABEL = ['1st', '2nd', '3rd', '4th']
const PLACEMENT_COLOR = ['text-yellow-400', 'text-slate-300', 'text-amber-600', 'text-slate-500']

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function fmtTotal(total) {
  const sign = total > 0 ? '+' : ''
  return `${sign}${(total / 1000).toFixed(1)}k`
}

// ── Share / Copy ──────────────────────────────────────────────────────────────

function ShareButton({ game, className = '' }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const text = generateSummaryText(game)
    if (navigator.share) {
      try { await navigator.share({ text }); return } catch { /* fallthrough */ }
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* blocked */ }
  }

  return (
    <button
      onClick={handleShare}
      className={`py-2 px-4 rounded-lg border border-slate-600 text-xs text-slate-300 hover:border-sky-600 hover:text-sky-400 transition-colors ${className}`}
    >
      {copied ? 'Copied!' : 'Share / Copy'}
    </button>
  )
}

// ── Hand log ─────────────────────────────────────────────────────────────────

function HandLog({ log }) {
  const [expanded, setExpanded] = useState(false)
  if (!log?.length) return <p className="text-xs text-slate-500">No hands recorded.</p>

  const visible = expanded ? log : log.slice(0, 5)

  return (
    <div className="space-y-1">
      {visible.map((entry, i) => (
        <div key={i} className="flex items-start gap-2 text-xs py-1 border-b border-slate-800 last:border-0">
          <span className={`shrink-0 rounded px-1 text-[10px] font-bold ${
            entry.type === 'win' ? 'bg-sky-900 text-sky-300' :
            entry.type === 'draw' ? 'bg-slate-700 text-slate-400' :
            entry.type === 'chombo' ? 'bg-rose-900 text-rose-400' :
            'bg-slate-700 text-slate-400'
          }`}>
            {entry.type ?? '—'}
          </span>
          <span className="text-slate-400 flex-1 leading-relaxed">{entry.label}</span>
        </div>
      ))}
      {log.length > 5 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-slate-500 hover:text-slate-300 pt-1"
        >
          {expanded ? 'Show less' : `Show all ${log.length} hands`}
        </button>
      )}
    </div>
  )
}

// ── Game detail view ──────────────────────────────────────────────────────────

function GameDetail({ game, onBack, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { players, rules, numPlayers, log, gameType, date } = game
  const umaArr = rules?.uma?.slice(0, numPlayers) ?? (numPlayers === 3 ? [15000, 0, -15000] : [15000, 5000, -5000, -15000])
  const returnPts = rules?.returnPts ?? (numPlayers === 3 ? 35000 : 30000)
  const { placement, uma, totals } = calculateFinalScores(players, { uma: umaArr, returnPts, oka: rules?.oka ?? 0 })

  const ranked = players
    .map((p, i) => ({ ...p, index: i, placement: placement[i], uma: uma[i], total: totals[i] }))
    .sort((a, b) => a.placement - b.placement)

  const gameTypeLabel = gameType === 'tonpuusen' ? 'Tonpuusen' : 'Hanchan'

  return (
    <div className="px-4 py-4 space-y-5 max-w-md mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-200 text-sm">← Back</button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-slate-100 truncate">
            {gameTypeLabel} ({numPlayers}P) · {fmtDate(date)}
          </h2>
          <p className="text-xs text-slate-500">{log?.length ?? 0} hands</p>
        </div>
        <ShareButton game={game} />
      </div>

      {/* Placement table */}
      <div className="bg-slate-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-slate-700 text-xs text-slate-400 font-semibold uppercase">
          <div className="col-span-2">Player</div>
          <div className="text-right">Score</div>
          <div className="text-right">Uma</div>
          <div className="text-right">Total</div>
        </div>
        {ranked.map((p) => (
          <div key={p.index} className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-slate-700 last:border-0 items-center">
            <div className="col-span-2 flex items-center gap-2">
              <span className={`text-sm font-bold w-8 ${PLACEMENT_COLOR[p.placement - 1]}`}>
                {PLACEMENT_LABEL[p.placement - 1]}
              </span>
              <span className="text-slate-200 text-sm truncate">{p.name}</span>
            </div>
            <div className={`text-right text-sm tabular-nums ${p.score < 0 ? 'text-red-400' : 'text-slate-300'}`}>
              {p.score.toLocaleString()}
            </div>
            <div className={`text-right text-sm tabular-nums font-medium ${p.uma > 0 ? 'text-green-400' : p.uma < 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {p.uma > 0 ? '+' : ''}{(p.uma / 1000).toFixed(0)}k
            </div>
            <div className={`text-right text-sm tabular-nums font-bold ${p.total >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
              {fmtTotal(p.total)}
            </div>
          </div>
        ))}
      </div>

      {/* Settings summary */}
      <p className="text-xs text-slate-500 text-center">
        Uma: {umaArr.map((v) => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(0)}k`).join(' / ')}
        &nbsp;·&nbsp; Return: {returnPts.toLocaleString()}
        {(rules?.oka ?? 0) !== 0 && <>&nbsp;·&nbsp; Oka: {rules.oka > 0 ? '+' : ''}{rules.oka.toLocaleString()}</>}
      </p>

      {/* Hand log */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Hand Log</h3>
        <HandLog log={log} />
      </div>

      {/* Delete */}
      <div className="pt-2">
        {confirmDelete ? (
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:border-slate-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              className="flex-1 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-sm font-semibold transition-colors"
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-500 hover:border-rose-700 hover:text-rose-400 text-sm transition-colors"
          >
            Delete this game
          </button>
        )}
      </div>
    </div>
  )
}

// ── Game list card ────────────────────────────────────────────────────────────

function GameCard({ game, onClick }) {
  const { players, rules, numPlayers, log, gameType, date } = game
  const umaArr = rules?.uma?.slice(0, numPlayers) ?? (numPlayers === 3 ? [15000, 0, -15000] : [15000, 5000, -5000, -15000])
  const returnPts = rules?.returnPts ?? (numPlayers === 3 ? 35000 : 30000)
  const { placement, totals } = calculateFinalScores(players, { uma: umaArr, returnPts, oka: rules?.oka ?? 0 })

  const ranked = players
    .map((p, i) => ({ ...p, placement: placement[i], total: totals[i] }))
    .sort((a, b) => a.placement - b.placement)

  const gameTypeLabel = gameType === 'tonpuusen' ? 'Tonpuusen' : 'Hanchan'

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-2xl p-4 space-y-3 transition-colors"
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-sm font-semibold text-slate-200">{gameTypeLabel} ({numPlayers}P)</span>
          <span className="ml-2 text-xs text-slate-500">{fmtDate(date)}</span>
        </div>
        <span className="text-xs text-slate-600 shrink-0">{log?.length ?? 0} hands</span>
      </div>

      {/* Player results — compact */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {ranked.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className={`text-xs font-bold w-6 ${PLACEMENT_COLOR[p.placement - 1]}`}>
              {PLACEMENT_LABEL[p.placement - 1]}
            </span>
            <span className="text-xs text-slate-300 truncate flex-1">{p.name}</span>
            <span className={`text-xs tabular-nums font-medium ${p.total >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
              {fmtTotal(p.total)}
            </span>
          </div>
        ))}
      </div>
    </button>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function HistoryMode() {
  const { games, deleteGame } = useHistoryStore()
  const [selectedId, setSelectedId] = useState(null)

  const selected = selectedId ? games.find((g) => g.id === selectedId) : null

  if (selected) {
    return (
      <GameDetail
        game={selected}
        onBack={() => setSelectedId(null)}
        onDelete={() => { deleteGame(selected.id); setSelectedId(null) }}
      />
    )
  }

  return (
    <div className="px-4 py-4 space-y-4 max-w-md mx-auto pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100">Game History</h2>
        <span className="text-xs text-slate-500">{games.length} game{games.length !== 1 ? 's' : ''}</span>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-slate-400 text-sm">No games recorded yet.</p>
          <p className="text-slate-600 text-xs">Games are saved when you press "New Game" at the end of a session.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} onClick={() => setSelectedId(game.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
