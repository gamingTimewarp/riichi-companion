import { useState, useMemo } from 'react'
import useGameStore from '../../stores/gameStore'
import { calculateDrawPayments, formatRoundLabel } from '../../lib/scoring'

const isRiichiDeclared = (r) => r === 'riichi' || r === 'double'

export default function DrawEntrySheet({ onConfirm, onCancel, riichiFlags }) {
  const {
    players, dealer, round, honba, riichiPool, drawRule, numPlayers, rules,
    updateScores, addLogEntry, advanceAfterDraw, setRiichiPool, getSnapshot,
  } = useGameStore()
  const riichiStickValue = rules?.riichiStickValue ?? 1000

  const [tenpai, setTenpai] = useState(() => players.map(() => false))

  function toggle(i) {
    setTenpai((prev) => { const n = [...prev]; n[i] = !n[i]; return n })
  }

  const tenpaiIndices = useMemo(
    () => tenpai.map((v, i) => (v ? i : -1)).filter((i) => i >= 0),
    [tenpai],
  )
  const { deltas: drawDeltas } = useMemo(
    () => calculateDrawPayments(tenpaiIndices, drawRule, numPlayers),
    [tenpaiIndices, drawRule, numPlayers],
  )

  const dealerTenpai = tenpai[dealer]

  // Riichi sticks from pre-declared markers (GameScreen) — will be deducted + added to pool
  const riichiCount = (riichiFlags ?? []).filter(isRiichiDeclared).length
  const riichiDeltas = (riichiFlags ?? []).map((r) => (isRiichiDeclared(r) ? -riichiStickValue : 0))

  // Combined deltas for preview: riichi deductions + draw payments
  const combinedDeltas = drawDeltas.map((d, i) => d + (riichiDeltas[i] ?? 0))

  function handleConfirm() {
    const snapshot = getSnapshot()

    // 1. Deduct riichi sticks and add to pool (sticks carry over to next hand)
    if (riichiCount > 0) {
      updateScores(riichiDeltas)
      setRiichiPool(riichiPool + riichiCount)
    }

    // 2. Apply tenpai/noten draw payments
    updateScores(drawDeltas)

    const roundPrefix = formatRoundLabel(round, honba)
    const tenpaiPart = tenpaiIndices.length === 0
      ? 'all noten'
      : `tenpai: ${tenpaiIndices.map((i) => players[i].name).join(', ')}`
    const label = `${roundPrefix} · Draw — ${tenpaiPart}`

    addLogEntry({ snapshot, label, deltas: combinedDeltas, type: 'draw' })
    advanceAfterDraw({ dealerTenpai, allTenpai: tenpaiIndices.length === numPlayers })
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
          ? 'Fixed 3000pt pool split among tenpai; noten players split paying 3000.'
          : 'Each noten player pays 1000pts; tenpai players split the total.'}
        {dealerTenpai && <span className="text-yellow-400 ml-2 font-medium">Dealer tenpai = renchan.</span>}
      </div>

      {/* Pre-declared riichi from GameScreen */}
      {riichiCount > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl px-4 py-3 text-xs space-y-1">
          <div className="text-yellow-300 font-semibold">Riichi declarations this hand</div>
          {(riichiFlags ?? []).map((r, i) => r ? (
            <div key={i} className="text-yellow-400">
              {players[i].name} — 立直 stick added to pool (−{riichiStickValue.toLocaleString()}pts)
            </div>
          ) : null)}
          <div className="text-yellow-500 pt-1">
            Pool after: {((riichiPool + riichiCount) * riichiStickValue).toLocaleString()}pts (carries to next hand)
          </div>
        </div>
      )}

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
            <span className="font-medium flex items-center gap-2">
              {p.name}
              {riichiFlags?.[i] === 'double' && <span className="text-orange-400 text-[10px] font-bold">2立直</span>}
              {riichiFlags?.[i] === 'riichi' && <span className="text-yellow-400 text-[10px] font-bold">立直</span>}
            </span>
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
        {combinedDeltas.map((d, i) => d !== 0 ? (
          <div key={i} className="flex justify-between">
            <span className="text-slate-400">{players[i].name}</span>
            <span className={d > 0 ? 'text-green-400' : 'text-red-400'}>
              {d > 0 ? '+' : ''}{d.toLocaleString()}
            </span>
          </div>
        ) : null)}
        {combinedDeltas.every((d) => d === 0) && (
          <div className="text-slate-500">No score change (all tenpai or all noten, no riichi)</div>
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
