import { useState, useMemo } from 'react'
import useGameStore from '../../stores/gameStore'
import { calculateChomboPayments, calculateDrawPayments, formatRoundLabel } from '../../lib/scoring'

const isRiichiDeclared = (r) => r === 'riichi' || r === 'double'

export default function ChomboSheet({ onConfirm, onFalseTenpaiConfirm, onCancel, riichiFlags }) {
  const {
    players, dealer, round, honba, riichiPool, numPlayers, rules, drawRule,
    updateScores, addLogEntry, setRiichiPool, getSnapshot,
  } = useGameStore()
  const riichiStickValue = rules?.riichiStickValue ?? 1000

  const [chomboType, setChomboType] = useState('general') // 'general' | 'false-tenpai'
  const [offender, setOffender] = useState(null)

  // Which players declared tenpai at the draw (riichi players are locked in)
  const [tenpai, setTenpai] = useState(() => (riichiFlags ?? players.map(() => 'none')).map(isRiichiDeclared))

  const tenpaiIndices = useMemo(
    () => tenpai.map((v, i) => (v ? i : -1)).filter((i) => i >= 0),
    [tenpai],
  )

  // Payments
  const payment = useMemo(() => {
    if (offender === null) return null

    if (chomboType === 'general') {
      return calculateChomboPayments(offender, dealer, numPlayers)
    }

    // False tenpai: offender must have declared tenpai
    if (!tenpaiIndices.includes(offender)) return null
    // Recalculate draw with offender treated as noten
    const correctedTenpai = tenpaiIndices.filter((i) => i !== offender)
    const { deltas: drawDeltas } = calculateDrawPayments(correctedTenpai, drawRule, numPlayers)
    const { deltas: chomboDeltas } = calculateChomboPayments(offender, dealer, numPlayers)
    return { deltas: drawDeltas.map((d, i) => d + chomboDeltas[i]) }
  }, [offender, chomboType, tenpaiIndices, dealer, numPlayers, drawRule])

  // Riichi sticks from this hand (false tenpai only — these carry over like a normal draw)
  const riichiCount = (riichiFlags ?? []).filter(isRiichiDeclared).length
  const riichiDeltas = (riichiFlags ?? []).map((r) => (isRiichiDeclared(r) ? -riichiStickValue : 0))

  // Preview deltas including riichi deductions for false tenpai
  const previewDeltas = useMemo(() => {
    if (!payment) return null
    if (chomboType === 'false-tenpai' && riichiCount > 0) {
      return payment.deltas.map((d, i) => d + riichiDeltas[i])
    }
    return payment.deltas
  }, [payment, chomboType, riichiCount, riichiDeltas])

  function handleTypeSwitch(type) {
    setChomboType(type)
    setOffender(null)
  }

  function toggleTenpai(i) {
    setTenpai((prev) => {
      const n = [...prev]
      n[i] = !n[i]
      return n
    })
    // Clear offender if they were de-selected from tenpai
    if (offender === i && tenpai[i]) setOffender(null)
  }

  function handleConfirm() {
    if (!payment) return
    const snapshot = getSnapshot()

    if (chomboType === 'false-tenpai') {
      // Deduct riichi sticks and carry them to the pool
      if (riichiCount > 0) {
        updateScores(riichiDeltas)
        setRiichiPool(riichiPool + riichiCount)
      }
      updateScores(payment.deltas)
      addLogEntry({
        snapshot,
        label: `${formatRoundLabel(round, honba)} · False Tenpai Chombo — ${players[offender].name}`,
        deltas: previewDeltas,
        type: 'chombo',
      })
      onFalseTenpaiConfirm?.()
    } else {
      updateScores(payment.deltas)
      addLogEntry({
        snapshot,
        label: `${formatRoundLabel(round, honba)} · Chombo — ${players[offender].name}`,
        deltas: payment.deltas,
        type: 'chombo',
      })
      onConfirm()
    }
  }

  return (
    <div className="px-4 py-4 space-y-5 max-w-md mx-auto pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100">Chombo</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 text-sm">Cancel</button>
      </div>

      {/* Chombo type selector */}
      <div className="flex gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
        {[
          { id: 'general', label: 'Rule Violation' },
          { id: 'false-tenpai', label: 'False Tenpai' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleTypeSwitch(id)}
            className={[
              'flex-1 py-1.5 text-sm font-medium rounded transition-colors',
              chomboType === id ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Description */}
      <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-400">
        {chomboType === 'general' ? (
          <>
            Penalty for an invalid win or other rule violation. The offending player pays the
            equivalent of a mangan tsumo loss. Round does{' '}
            <span className="font-semibold text-slate-300">not</span> advance.
          </>
        ) : (
          <>
            A player declared tenpai at the exhaustive draw but their hand was not actually in
            tenpai. Draw payments are recalculated treating them as noten, plus they pay the
            standard chombo penalty. Round does{' '}
            <span className="font-semibold text-slate-300">not</span> advance.
          </>
        )}
      </div>

      {/* False tenpai: tenpai declaration selector */}
      {chomboType === 'false-tenpai' && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Who declared tenpai?</h3>
          <div className="space-y-1.5">
            {players.map((p, i) => {
              const hasRiichi = isRiichiDeclared(riichiFlags?.[i])
              return (
                <button
                  key={i}
                  onClick={() => !hasRiichi && toggleTenpai(i)}
                  className={[
                    'w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-colors',
                    tenpai[i]
                      ? hasRiichi
                        ? 'bg-yellow-900/30 border-yellow-700 text-yellow-300'
                        : 'bg-green-900/30 border-green-700 text-green-300'
                      : 'bg-slate-800 border-slate-600 text-slate-300',
                    hasRiichi ? 'cursor-default' : '',
                  ].join(' ')}
                >
                  <span className="font-medium flex items-center gap-2">
                    {p.name}
                    {riichiFlags?.[i] === 'double' && (
                      <span className="text-orange-400 text-[10px] font-bold">2立直</span>
                    )}
                    {riichiFlags?.[i] === 'riichi' && (
                      <span className="text-yellow-400 text-[10px] font-bold">立直</span>
                    )}
                  </span>
                  <span className="text-sm">
                    {tenpai[i] ? 'Tenpai' : 'Noten'}
                    {hasRiichi && <span className="ml-1 text-[10px] text-yellow-600">(riichi)</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Offender selector */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {chomboType === 'false-tenpai' ? 'Who falsely declared tenpai?' : 'Who committed chombo?'}
        </h3>
        {chomboType === 'false-tenpai' && tenpaiIndices.length === 0 ? (
          <p className="text-xs text-slate-500 px-1">Select at least one tenpai player above.</p>
        ) : (
          players.map((p, i) => {
            if (chomboType === 'false-tenpai' && !tenpaiIndices.includes(i)) return null
            return (
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
            )
          })
        )}
      </div>

      {/* Riichi context for false tenpai */}
      {chomboType === 'false-tenpai' && riichiCount > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl px-4 py-3 text-xs space-y-1">
          <div className="text-yellow-300 font-semibold">Riichi sticks this hand</div>
          {(riichiFlags ?? []).map((r, i) =>
            isRiichiDeclared(r) ? (
              <div key={i} className="text-yellow-400">
                {players[i].name} — stick added to pool (−{riichiStickValue.toLocaleString()}pts)
              </div>
            ) : null,
          )}
          <div className="text-yellow-500 pt-0.5">
            Pool after: {((riichiPool + riichiCount) * riichiStickValue).toLocaleString()}pts
          </div>
        </div>
      )}

      {/* Payment preview */}
      {previewDeltas && (
        <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-slate-200 mb-1">Payment Preview</div>
          {previewDeltas.map((d, i) =>
            d !== 0 ? (
              <div key={i} className="flex justify-between">
                <span className="text-slate-400">{players[i].name}</span>
                <span className={d > 0 ? 'text-green-400' : 'text-red-400'}>
                  {d > 0 ? '+' : ''}
                  {d.toLocaleString()}
                </span>
              </div>
            ) : null,
          )}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={!payment}
        className="w-full py-3 bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors"
      >
        Confirm Chombo
      </button>
    </div>
  )
}
