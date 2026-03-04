import { useState, useMemo } from 'react'
import useGameStore from '../../stores/gameStore'
import { calculateDrawPayments } from '../../lib/scoring'

export default function DrawEntrySheet({ onConfirm, onCancel }) {
  const { players, dealer, drawRule, updateScores, addLogEntry, advanceAfterDraw } = useGameStore()
  const [tenpai, setTenpai] = useState([false, false, false, false])

  function toggle(i) {
    setTenpai((prev) => { const n = [...prev]; n[i] = !n[i]; return n })
  }

  const tenpaiIndices = tenpai.map((v, i) => v ? i : -1).filter((i) => i >= 0)

  const { deltas } = useMemo(() => calculateDrawPayments(tenpaiIndices, drawRule), [tenpaiIndices.join(','), drawRule])

  const dealerTenpai = tenpai[dealer]

  function handleConfirm() {
    updateScores(deltas)
    const label = tenpaiIndices.length === 0
      ? 'Draw — all noten'
      : `Draw — tenpai: ${tenpaiIndices.map((i) => players[i].name).join(', ')}`
    addLogEntry({ label, deltas, type: 'draw' })
    advanceAfterDraw({ dealerTenpai })
    onConfirm()
  }

  return (
    <div className="px-4 py-4 space-y-5 max-w-md mx-auto pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100">Draw (Ryuukyoku)</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 text-sm">Cancel</button>
      </div>

      <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-400">
        {drawRule === 'fixed-pool'
          ? 'Fixed 3000pt pool split among tenpai players; noten players split paying 3000.'
          : 'Each noten player pays 1000pts; tenpai players split the total.'}
        {dealerTenpai && <span className="text-yellow-400 ml-2 font-medium">Dealer tenpai = renchan.</span>}
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tenpai?</h3>
        {players.map((p, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
              tenpai[i]
                ? 'bg-green-800 border-green-500 text-white'
                : 'bg-slate-800 border-slate-600 text-slate-300'
            }`}
          >
            <span className="font-medium">{p.name}</span>
            <span className="text-sm">
              {tenpai[i] ? 'Tenpai' : 'Noten'}
              {i === dealer && <span className="ml-2 text-xs opacity-70">(dealer)</span>}
            </span>
          </button>
        ))}
      </div>

      {/* Payment preview */}
      <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1">
        <div className="font-semibold text-slate-200 mb-1">Payment Preview</div>
        {deltas.map((d, i) => d !== 0 ? (
          <div key={i}>
            {players[i].name}: <span className={d > 0 ? 'text-green-400' : 'text-red-400'}>
              {d > 0 ? '+' : ''}{d.toLocaleString()}
            </span>
          </div>
        ) : null)}
        {deltas.every((d) => d === 0) && (
          <div className="text-slate-500">No payment (all tenpai or all noten)</div>
        )}
      </div>

      <button
        onClick={handleConfirm}
        className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-colors"
      >
        Confirm Draw
      </button>
    </div>
  )
}
