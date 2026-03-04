import { useState } from 'react'
import useGameStore from '../../stores/gameStore'
import { calculateNagashiPayments } from '../../lib/scoring'
import { getSeatWindName } from '../../lib/scoring'

export default function NagashiSheet({ onConfirm, onCancel }) {
  const { players, dealer, updateScores, addLogEntry, advanceAfterDraw, getSnapshot } = useGameStore()
  const [winner, setWinner] = useState(null)

  const payment = winner !== null ? calculateNagashiPayments(winner, dealer) : null

  function handleConfirm() {
    if (payment === null) return
    updateScores(payment.deltas)
    addLogEntry({
      label: `Nagashi Mangan — ${players[winner].name}`,
      deltas: payment.deltas,
      type: 'nagashi',
    })
    // Treated as a draw for renchan: dealer tenpai = renchan
    advanceAfterDraw({ dealerTenpai: winner === dealer })
    onConfirm()
  }

  return (
    <div className="px-4 py-4 space-y-5 max-w-md mx-auto pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100">Nagashi Mangan</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 text-sm">Cancel</button>
      </div>

      <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-400">
        All of the player's discards were terminals or honours, and none were claimed.
        Pays out as mangan tsumo. Treated as a draw for renchan purposes.
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Who achieved nagashi?</h3>
        {players.map((p, i) => (
          <button
            key={i}
            onClick={() => setWinner(i)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
              winner === i
                ? 'bg-teal-800 border-teal-500 text-white'
                : 'bg-slate-800 border-slate-600 text-slate-300'
            }`}
          >
            <span className="font-medium">{p.name}</span>
            <span className="text-xs text-slate-500">{getSeatWindName(i, dealer)}</span>
          </button>
        ))}
      </div>

      {payment && (
        <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-slate-200 mb-1">Payment Preview (Mangan Tsumo)</div>
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
        disabled={winner === null}
        className="w-full py-3 bg-teal-700 hover:bg-teal-600 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors"
      >
        Confirm Nagashi Mangan
      </button>
    </div>
  )
}
