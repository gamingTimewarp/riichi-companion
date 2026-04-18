import { useState } from 'react'
import useGameStore from '../../stores/gameStore'
import useHistoryStore from '../../stores/historyStore'
import { calculateFinalScores } from '../../lib/scoring'
import { generateSummaryText } from '../../lib/gameSummary'
import { exportJSON } from '../../lib/storage'

const PLACEMENT_LABEL = ['1st', '2nd', '3rd', '4th']
const PLACEMENT_COLOR = ['text-yellow-400', 'text-slate-300', 'text-amber-600', 'text-slate-500']
const PLAYER_COLORS = ['#38bdf8', '#f87171', '#4ade80', '#fbbf24']

// ── Score history SVG chart ───────────────────────────────────────────────────

function ScoreChart({ players, log }) {
  if (log.length === 0) return null

  const history = log.map((entry) => entry.snapshot?.players?.map((p) => p.score) ?? null).filter(Boolean)
  history.push(players.map((p) => p.score))

  if (history.length < 2) return null

  const W = 320
  const H = 160
  const PAD_X = 8
  const PAD_T = 12
  const PAD_B = 24

  const allScores = history.flat()
  const minScore = Math.min(...allScores)
  const maxScore = Math.max(...allScores)
  const range = (maxScore - minScore) || 10000
  const lo = minScore - range * 0.05
  const hi = maxScore + range * 0.05
  const steps = history.length - 1

  function toX(i) { return PAD_X + (i / steps) * (W - PAD_X * 2) }
  function toY(score) { return PAD_T + (1 - (score - lo) / (hi - lo)) * (H - PAD_T - PAD_B) }

  const zeroY = toY(0)
  const showZeroLine = minScore < 0 && zeroY > PAD_T && zeroY < H - PAD_B
  const xLabels = [0, ...Array.from({ length: log.length }, (_, i) => i + 1)]
  const labelStep = Math.ceil(xLabels.length / 8)

  return (
    <div className="bg-slate-800 rounded-2xl p-3 space-y-2">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Score Progression</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        {showZeroLine && (
          <line x1={PAD_X} y1={zeroY} x2={W - PAD_X} y2={zeroY} stroke="#475569" strokeWidth="1" strokeDasharray="4 3" />
        )}
        {players.map((_, pi) => {
          const pts = history.map((scores, i) => `${toX(i)},${toY(scores[pi] ?? 0)}`).join(' ')
          return <polyline key={pi} points={pts} fill="none" stroke={PLAYER_COLORS[pi % PLAYER_COLORS.length]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        })}
        {players.map((_, pi) => {
          const last = history[history.length - 1]
          return <circle key={pi} cx={toX(steps)} cy={toY(last[pi] ?? 0)} r="3" fill={PLAYER_COLORS[pi % PLAYER_COLORS.length]} />
        })}
        {xLabels.filter((_, i) => i % labelStep === 0 || i === xLabels.length - 1).map((n) => (
          <text key={n} x={toX(n)} y={H - 4} textAnchor="middle" fontSize="9" fill="#64748b">{n}</text>
        ))}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
        {players.map((p, pi) => (
          <div key={pi} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: PLAYER_COLORS[pi % PLAYER_COLORS.length] }} />
            <span className="text-xs text-slate-400 truncate max-w-[6rem]">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Share / Copy button ───────────────────────────────────────────────────────

function ShareButton({ game }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const text = generateSummaryText(game)
    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {
        // user cancelled or API unavailable — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked — do nothing silently
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold rounded-xl transition-colors"
    >
      {copied ? 'Copied!' : 'Share / Copy'}
    </button>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function EndGameScreen({ onNewGame }) {
  const { players, log, numPlayers, rules, gameType, endGame } = useGameStore()
  const saveGame = useHistoryStore((s) => s.saveGame)

  const currentUma = rules?.uma?.slice(0, numPlayers) ?? (numPlayers === 3 ? [15000, 0, -15000] : [15000, 5000, -5000, -15000])
  const returnPts = rules?.returnPts ?? (numPlayers === 3 ? 35000 : 30000)
  const { placement, uma, totals } = calculateFinalScores(players, {
    uma: currentUma,
    returnPts,
    oka: rules?.oka ?? 0,
  })

  const ranked = players
    .map((p, i) => ({ ...p, index: i, placement: placement[i], uma: uma[i], total: totals[i] }))
    .sort((a, b) => a.placement - b.placement)

  // The current game snapshot passed to summary/share utilities
  const gameRecord = { players, log, numPlayers, rules, gameType, date: new Date().toISOString() }

  function handleExport() {
    exportJSON('riichi-game', `riichi-game-${new Date().toISOString().slice(0, 10)}.json`)
  }

  function handleNewGame() {
    if (log.length > 0) {
      saveGame({ players, log, numPlayers, rules, gameType })
    }
    endGame()
    onNewGame()
  }

  return (
    <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-slate-100">Final Results</h2>

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
              {p.total > 0 ? '+' : ''}{(p.total / 1000).toFixed(1)}k
            </div>
          </div>
        ))}
      </div>

      <ScoreChart players={players} log={log} />

      <div className="text-xs text-slate-500 text-center">
        Uma: {currentUma.map((v) => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(0)}k`).join(' / ')}
        &nbsp;·&nbsp; Return: {returnPts.toLocaleString()}
        {(rules?.oka ?? 0) !== 0 && <>&nbsp;·&nbsp; Oka: {rules.oka > 0 ? '+' : ''}{rules.oka.toLocaleString()}</>}
      </div>

      <div className="text-xs text-slate-500 text-center">{log.length} hands recorded</div>

      <div className="flex gap-3">
        <ShareButton game={gameRecord} />
        <button
          onClick={handleExport}
          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold rounded-xl transition-colors"
        >
          Export JSON
        </button>
      </div>

      <button
        onClick={handleNewGame}
        className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-colors"
      >
        New Game
      </button>
    </div>
  )
}
