import { useState, useMemo } from 'react'
import useGameStore from '../../stores/gameStore'
import { calculatePayments } from '../../lib/scoring'

const FU_OPTIONS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110]
const HAN_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 26]
const HAN_LABEL = { 13: '13 (Yakuman)', 26: '26 (Double)' }
const QUICK_POINTS = [1000, 1500, 2000, 2900, 3900, 4000, 5800, 7700, 8000, 11600, 12000, 16000, 24000, 32000, 48000, 64000]

const isRiichiDeclared = (r) => r === 'riichi' || r === 'double'

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

export default function HandEntrySheet({ onConfirm, onCancel, riichiFlags }) {
  const { players, dealer, honba, riichiPool, entryMode, numPlayers, rules, updateScores, addLogEntry, advanceAfterWin, setRiichiPool, getSnapshot } = useGameStore()
  const riichiStickValue = rules?.riichiStickValue ?? 1000
  const honbaValuePerPayer = rules?.honbaValuePerPayer ?? 100

  const [winner, setWinner] = useState(null)
  const [isTsumo, setIsTsumo] = useState(true)
  const [discarder, setDiscarder] = useState(null)
  // Pre-populate from GameScreen riichi markers ('none'|'riichi'|'double')
  const [riichis, setRiichis] = useState(riichiFlags ?? players.map(() => 'none'))
  const [han, setHan] = useState(null)
  const [fu, setFu] = useState(null)
  const [quickPoints, setQuickPoints] = useState(null)

  function cycleRiichi(i) {
    setRiichis((prev) => {
      const n = [...prev]
      const curr = n[i]
      n[i] = isRiichiDeclared(curr) ? (curr === 'riichi' ? 'double' : 'none') : 'riichi'
      return n
    })
  }

  const riichiSticks = riichis.filter(isRiichiDeclared).length
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
        numPlayers,
        riichiStickValue,
        honbaValuePerPayer,
      })
    } else {
      if (quickPoints === null) return null
      if (!isTsumo && discarder === null) return null
      const deltas = new Array(numPlayers).fill(0)
      if (isTsumo) {
        // Distribute tsumo proportionally (approximate split)
        const isWinnerDealer = winner === dealer
        const dealerPay = isWinnerDealer
          ? Math.ceil(quickPoints / (numPlayers - 1) / 100) * 100
          : Math.ceil(quickPoints * 2 / numPlayers / 100) * 100
        const nonDealerPay = isWinnerDealer ? dealerPay : Math.ceil(quickPoints / numPlayers / 100) * 100
        for (let i = 0; i < numPlayers; i++) {
          if (i === winner) continue
          const pay = (i === dealer || isWinnerDealer) ? dealerPay : nonDealerPay
          deltas[i] -= pay
          deltas[winner] += pay
        }
      } else {
        deltas[discarder] -= quickPoints
        deltas[winner] += quickPoints
      }
      const honbaBonus = honba * honbaValuePerPayer * (numPlayers - 1)
      deltas[winner] += honbaBonus + effectivePool * riichiStickValue
      if (!isTsumo) deltas[discarder] -= honbaBonus
      else { for (let i = 0; i < numPlayers; i++) { if (i !== winner) deltas[i] -= honba * honbaValuePerPayer } }
      return { deltas }
    }
  }, [winner, isTsumo, discarder, han, fu, quickPoints, honba, effectivePool, dealer, entryMode, numPlayers, riichiStickValue, honbaValuePerPayer])

  function handleConfirm() {
    if (!payment || winner === null) return

    // Capture pre-hand snapshot for undo BEFORE any score changes
    const snapshot = getSnapshot()

    const riichiDeltas = riichis.map((r) => (isRiichiDeclared(r) ? -riichiStickValue : 0))
    if (riichiDeltas.some((d) => d !== 0)) {
      updateScores(riichiDeltas)
    }

    updateScores(payment.deltas)
    setRiichiPool(0)

    const doubleRiichiNote = riichis.some(r => r === 'double')
      ? ` [2立: ${riichis.map((r, i) => r === 'double' ? players[i].name : null).filter(Boolean).join(', ')}]`
      : ''
    const label = entryMode === 'detailed'
      ? `${players[winner].name} wins (${isTsumo ? 'tsumo' : `ron from ${players[discarder].name}`}) ${han === 26 ? 'Double Yakuman' : `${han}han ${fu}fu`}${doubleRiichiNote}`
      : `${players[winner].name} wins (${isTsumo ? 'tsumo' : `ron from ${players[discarder].name}`}) ${quickPoints?.toLocaleString()}pts${doubleRiichiNote}`

    addLogEntry({ snapshot, label, deltas: payment.deltas, type: 'win' })
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
          {honba > 0 && <span>{honba} honba (+{honba * honbaValuePerPayer}/player bonus)</span>}
          {riichiPool > 0 && <span>Pool: {(riichiPool * riichiStickValue).toLocaleString()}pts</span>}
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
              onClick={() => cycleRiichi(i)}
              className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                riichis[i] === 'double' ? 'bg-orange-700 border-orange-500 text-white' :
                riichis[i] === 'riichi' ? 'bg-yellow-700 border-yellow-500 text-white' :
                'bg-slate-800 border-slate-600 text-slate-400'
              }`}
              title="Tap to cycle: Riichi → Double Riichi → None"
            >
              {riichis[i] === 'double' ? '2立直' : riichis[i] === 'riichi' ? '立直' : p.name.split(' ')[0]}
            </button>
          ))}
        </div>
        {riichiSticks > 0 && (
          <p className="text-xs text-yellow-400">{riichiSticks} riichi stick(s) — {riichiStickValue.toLocaleString()}pts each deducted</p>
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
                  className={`h-10 rounded-lg border text-sm font-bold transition-colors px-2 ${
                    h >= 13 ? 'min-w-[4.5rem]' : 'w-10'
                  } ${
                    han === h
                      ? h >= 13 ? 'bg-amber-700 border-amber-500 text-white' : 'bg-sky-700 border-sky-500 text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-300'
                  }`}
                >
                  {HAN_LABEL[h] ?? h}
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
