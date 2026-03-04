import { useState, useMemo } from 'react'
import useGameStore from '../../stores/gameStore'
import { calculatePayments } from '../../lib/scoring'

const FU_OPTIONS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110]
const HAN_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
const QUICK_POINTS = [1000, 1500, 2000, 2900, 3900, 4000, 5800, 7700, 8000, 11600, 12000, 16000, 24000, 32000, 48000]

function PlayerBtn({ player, selected, onClick, color = 'sky' }) {
  const colors = {
    sky: selected ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300',
    rose: selected ? 'bg-rose-700 border-rose-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300',
  }
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 px-1 rounded-lg border text-xs font-medium transition-colors ${colors[color]}`}
    >
      {player.name}
    </button>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}

function formatDeltas(deltas, players) {
  return deltas.map((d, i) => d !== 0 ? `${players[i].name}: ${d > 0 ? '+' : ''}${d.toLocaleString()}` : null)
    .filter(Boolean).join('  ')
}

export default function HandEntrySheet({ onConfirm, onCancel }) {
  const { players, dealer, honba, riichiPool, entryMode, updateScores, addLogEntry, advanceAfterWin, setRiichiPool } = useGameStore()

  const [winner, setWinner] = useState(null)
  const [isTsumo, setIsTsumo] = useState(true)
  const [discarder, setDiscarder] = useState(null)
  const [riichis, setRiichis] = useState([false, false, false, false])
  const [han, setHan] = useState(null)
  const [fu, setFu] = useState(null)
  const [quickPoints, setQuickPoints] = useState(null)

  function toggleRiichi(i) {
    setRiichis((prev) => { const n = [...prev]; n[i] = !n[i]; return n })
  }

  const riichiSticks = riichis.filter(Boolean).length
  const effectivePool = riichiPool + riichiSticks

  const payment = useMemo(() => {
    if (winner === null) return null
    if (entryMode === 'detailed') {
      if (han === null || fu === null) return null
      if (!isTsumo && discarder === null) return null
      return calculatePayments({
        han, fu, isTsumo,
        winnerIndex: winner,
        discarderIndex: discarder,
        dealerIndex: dealer,
        honba,
        riichiPool: effectivePool,
      })
    } else {
      if (quickPoints === null) return null
      if (!isTsumo && discarder === null) return null
      const deltas = [0, 0, 0, 0]
      if (isTsumo) {
        // Distribute tsumo: approximate split (just use point value as total)
        const isWinnerDealer = winner === dealer
        const dealerPay = isWinnerDealer ? Math.ceil(quickPoints / 3 / 100) * 100 : quickPoints / 2
        const nonDealerPay = isWinnerDealer ? dealerPay : Math.ceil(quickPoints / 4 / 100) * 100
        for (let i = 0; i < 4; i++) {
          if (i === winner) continue
          const pay = (i === dealer || isWinnerDealer) ? dealerPay : nonDealerPay
          deltas[i] -= pay
          deltas[winner] += pay
        }
      } else {
        deltas[discarder] -= quickPoints
        deltas[winner] += quickPoints
      }
      const honbaBonus = honba * (isTsumo ? 300 : 300)
      deltas[winner] += honbaBonus + effectivePool * 1000
      if (!isTsumo) deltas[discarder] -= honbaBonus
      else { for (let i = 0; i < 4; i++) { if (i !== winner) deltas[i] -= honba * 100 } }
      return { deltas }
    }
  }, [winner, isTsumo, discarder, han, fu, quickPoints, honba, effectivePool, dealer, entryMode])

  function handleConfirm() {
    if (!payment || winner === null) return

    // Apply riichi declarations (1000 per declaring player, added to pool)
    const riichiDeltas = riichis.map((r) => (r ? -1000 : 0))
    if (riichiDeltas.some((d) => d !== 0)) {
      updateScores(riichiDeltas)
    }

    updateScores(payment.deltas)
    setRiichiPool(0)

    const label = entryMode === 'detailed'
      ? `${players[winner].name} wins (${isTsumo ? 'tsumo' : `ron from ${players[discarder].name}`}) ${han}han ${fu}fu`
      : `${players[winner].name} wins (${isTsumo ? 'tsumo' : `ron from ${players[discarder].name}`}) ${quickPoints?.toLocaleString()}pts`

    addLogEntry({ label, deltas: payment.deltas, type: 'win' })
    advanceAfterWin({ isDealer: winner === dealer })
    onConfirm()
  }

  const canConfirm = payment !== null && winner !== null && (isTsumo || discarder !== null)

  return (
    <div className="px-4 py-4 space-y-5 max-w-md mx-auto pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100">Record Win</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 text-sm">Cancel</button>
      </div>

      {/* Honba info */}
      {(honba > 0 || riichiPool > 0) && (
        <div className="flex gap-2 text-xs text-slate-400">
          {honba > 0 && <span>{honba} honba (+{honba * 100}/player bonus)</span>}
          {riichiPool > 0 && <span>Pool: {riichiPool * 1000}pts</span>}
        </div>
      )}

      <Section title="Winner">
        <div className="flex gap-2">
          {players.map((p, i) => (
            <PlayerBtn key={i} player={p} selected={winner === i} onClick={() => setWinner(i)} color="sky" />
          ))}
        </div>
      </Section>

      <Section title="Win Type">
        <div className="flex gap-2">
          {[{ v: true, l: 'Tsumo' }, { v: false, l: 'Ron' }].map(({ v, l }) => (
            <button
              key={l}
              onClick={() => setIsTsumo(v)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                isTsumo === v ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </Section>

      {!isTsumo && (
        <Section title="Discarder">
          <div className="flex gap-2">
            {players.map((p, i) => (
              <PlayerBtn
                key={i} player={p}
                selected={discarder === i}
                onClick={() => i !== winner && setDiscarder(i)}
                color="rose"
              />
            ))}
          </div>
        </Section>
      )}

      <Section title="Riichi Declarations">
        <div className="flex gap-2">
          {players.map((p, i) => (
            <button
              key={i}
              onClick={() => toggleRiichi(i)}
              className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                riichis[i] ? 'bg-yellow-700 border-yellow-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'
              }`}
            >
              {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
        {riichiSticks > 0 && (
          <p className="text-xs text-yellow-400">{riichiSticks} riichi stick(s) — 1000pts each deducted</p>
        )}
      </Section>

      {entryMode === 'detailed' ? (
        <>
          <Section title="Han">
            <div className="flex flex-wrap gap-2">
              {HAN_OPTIONS.map((h) => (
                <button
                  key={h}
                  onClick={() => setHan(h)}
                  className={`w-10 h-10 rounded-lg border text-sm font-bold transition-colors ${
                    han === h ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Fu">
            <div className="flex flex-wrap gap-2">
              {FU_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFu(f)}
                  className={`w-12 h-10 rounded-lg border text-sm font-bold transition-colors ${
                    fu === f ? 'bg-violet-700 border-violet-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </Section>
        </>
      ) : (
        <Section title="Points">
          <div className="flex flex-wrap gap-2">
            {QUICK_POINTS.map((pts) => (
              <button
                key={pts}
                onClick={() => setQuickPoints(pts)}
                className={`px-3 h-10 rounded-lg border text-sm font-bold transition-colors ${
                  quickPoints === pts ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'
                }`}
              >
                {pts.toLocaleString()}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Payment preview */}
      {payment && (
        <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-300">
          <div className="font-semibold text-slate-200 mb-1">Payment Preview</div>
          {formatDeltas(payment.deltas, players)}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={!canConfirm}
        className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors"
      >
        Confirm
      </button>
    </div>
  )
}
