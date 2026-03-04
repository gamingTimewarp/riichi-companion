import useGameStore from '../../stores/gameStore'
import { calculateFinalScores } from '../../lib/scoring'
import { exportJSON } from '../../lib/storage'

const PLACEMENT_LABEL = ['1st', '2nd', '3rd', '4th']
const PLACEMENT_COLOR = ['text-yellow-400', 'text-slate-300', 'text-amber-600', 'text-slate-500']

export default function EndGameScreen({ onNewGame }) {
  const { players, log, endGame } = useGameStore()
  const { finalScores, placement, uma, totals } = calculateFinalScores(players)

  // Sort players by placement for display
  const ranked = players
    .map((p, i) => ({ ...p, index: i, placement: placement[i], uma: uma[i], total: totals[i] }))
    .sort((a, b) => a.placement - b.placement)

  function handleExport() {
    exportJSON('riichi-game', `riichi-game-${new Date().toISOString().slice(0, 10)}.json`)
  }

  function handleNewGame() {
    endGame()
    onNewGame()
  }

  return (
    <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-slate-100">Final Results</h2>

      <div className="bg-slate-800 rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-slate-700 text-xs text-slate-400 font-semibold uppercase">
          <div className="col-span-2">Player</div>
          <div className="text-right">Score</div>
          <div className="text-right">Uma</div>
          <div className="text-right">Total</div>
        </div>

        {ranked.map((p) => (
          <div
            key={p.index}
            className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-slate-700 last:border-0 items-center"
          >
            <div className="col-span-2 flex items-center gap-2">
              <span className={`text-sm font-bold w-8 ${PLACEMENT_COLOR[p.placement - 1]}`}>
                {PLACEMENT_LABEL[p.placement - 1]}
              </span>
              <span className="text-slate-200 text-sm truncate">{p.name}</span>
            </div>
            <div className={`text-right text-sm tabular-nums ${p.score < 0 ? 'text-red-400' : 'text-slate-300'}`}>
              {p.score.toLocaleString()}
            </div>
            <div className={`text-right text-sm tabular-nums font-medium ${p.uma > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {p.uma > 0 ? '+' : ''}{(p.uma / 1000).toFixed(0)}k
            </div>
            <div className={`text-right text-sm tabular-nums font-bold ${p.total >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
              {p.total > 0 ? '+' : ''}{(p.total / 1000).toFixed(1)}k
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-500 text-center">
        Uma: +15k / +5k / −5k / −15k (EMA) &nbsp;·&nbsp; Return: 30,000
      </div>

      <div className="text-xs text-slate-500 text-center">
        {log.length} hands recorded
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleExport}
          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold rounded-xl transition-colors"
        >
          Export JSON
        </button>
        <button
          onClick={handleNewGame}
          className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-colors"
        >
          New Game
        </button>
      </div>
    </div>
  )
}
