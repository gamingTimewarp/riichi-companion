import { useState } from 'react'
import useGameStore from '../../stores/gameStore'
import { calculateChomboPayments } from '../../lib/scoring'

export default function ChomboSheet({ onConfirm, onCancel }) {
  const { players, dealer, updateScores, addLogEntry, getSnapshot } = useGameStore()
  const [offender, setOffender] = useState(null)

  const payment = offender !== null ? calculateChomboPayments(offender, dealer) : null

  function handleConfirm() {
    if (payment === null) return
    const snapshot = getSnapshot()
    updateScores(payment.deltas)
    addLogEntry({
      snapshot,
      label: `Chombo — ${players[offender].name} pays penalty`,
      deltas: payment.deltas,
      type: 'chombo',
    })
    // Round does not advance — just go back to game
    onConfirm()
  }

  return (
    <div className="px-4 py-4 space-y-5 max-w-md mx-auto pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100">Chombo</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 text-sm">Cancel</button>
      </div>

      <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-400">
        Penalty for an invalid win or rule violation. The offending player pays equivalent
        to a mangan tsumo loss. Round does <span className="font-semibold text-slate-300">not</span> advance.
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Who committed chombo?</h3>
        {players.map((p, i) => (
          <button
            key={i}
            onClick={() => setOffender(i)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
              offender === i
                ? 'bg-rose-800 border-rose-500 text-white'
                : 'bg-slate-800 border-slate-600 text-slate-300'
            }`}
          >
            <span className="font-medium">{p.name}</span>
            {i === dealer && <span className="text-xs text-slate-500">dealer</span>}
          </button>
        ))}
      </div>

      {payment && (
        <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-slate-200 mb-1">Payment Preview</div>
          {payment.deltas.map((d, i) => d !== 0 ? (
            <div key={i}>
              {players[i].name}:{' '}
              <span className={d > 0 ? 'text-green-400' : 'text-red-400'}>
                {d > 0 ? '+' : ''}{d.toLocaleString()}
              </span>
            </div>
          ) : null)}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={offender === null}
        className="w-full py-3 bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors"
      >
        Confirm Chombo
      </button>
    </div>
  )
}
