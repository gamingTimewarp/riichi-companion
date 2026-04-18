import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import useGameStore from '../../stores/gameStore'
import { calculatePayments, generateQuickPointOptions, formatRoundLabel, formatHandValue, getRoundWind, getSeatWind } from '../../lib/scoring'
import { YAKU_NAMES } from '../analyzer/YakuList.jsx'
import AnalyzerEntryPanel from './AnalyzerEntryPanel.jsx'
import YakuList from '../analyzer/YakuList.jsx'
import ScorePanel from '../analyzer/ScorePanel.jsx'
import TileDisplay from '../tiles/TileDisplay.jsx'

const FU_OPTIONS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110]
const HAN_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 26]
const HAN_LABEL = { 13: '13 (Yakuman)', 26: '26 (Double)' }

const isRiichiDeclared = (r) => r === 'riichi' || r === 'double'

// Build yaku portion of the log label from an analysis result
function formatYakuForLabel(yaku, yakuman) {
  const names = Object.entries(yaku ?? {})
    .filter(([k]) => k !== 'dora' && k !== 'akadora')
    .map(([k]) => YAKU_NAMES[k] ?? k)
  if (yakuman) return `Yakuman${yakuman > 1 ? ` ×${yakuman}` : ''} (${names.join(', ')})`
  return names.join(', ')
}

function PlayerBtn({ player, selected, onClick, color = 'sky', disabled = false }) {
  const colors = {
    sky: selected ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300',
    rose: selected ? 'bg-rose-700 border-rose-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 py-2 px-1 rounded-lg border text-xs font-medium transition-colors disabled:opacity-30 ${colors[color]}`}
    >
      {player.name}
    </button>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      {title && <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{title}</h3>}
      {children}
    </div>
  )
}

function formatDeltas(deltas, players) {
  return deltas.map((d, i) => d !== 0 ? `${players[i].name}: ${d > 0 ? '+' : ''}${d.toLocaleString()}` : null)
    .filter(Boolean).join('  ')
}

function makeDefaultAnalyzerWinOpts(round, jikaze = 27) {
  return {
    tsumo: false,
    riichi: false,
    ippatsu: false,
    doubleRiichi: false,
    lastTile: false,
    afterKan: false,
    bakaze: getRoundWind(round),
    jikaze,
    doraIndicators: [],
    uraIndicators: [],
  }
}

export default function HandEntrySheet({ onConfirm, onCancel, riichiFlags }) {
  const { players, dealer, round, honba, riichiPool, entryMode, numPlayers, rules, updateScores, addLogEntry, advanceAfterWin, setRiichiPool, getSnapshot } = useGameStore()
  const riichiStickValue = rules?.riichiStickValue ?? 1000
  const honbaValuePerPayer = rules?.honbaValuePerPayer ?? 100
  const kiriageMangan = rules?.kiriageMangan ?? false
  const kazoeYakumanPolicy = rules?.kazoeYakumanPolicy ?? 'enabled'
  const allowMultiRon = rules?.multipleRon === 'allow'

  const [localMode, setLocalMode] = useState(() => entryMode)

  const quickPointOptions = useMemo(
    () => generateQuickPointOptions({ kiriageMangan, kazoeYakumanPolicy }),
    [kiriageMangan, kazoeYakumanPolicy],
  )

  // ── Primary winner state ──────────────────────────────────────────────────
  const [winner, setWinner] = useState(null)
  const [isTsumo, setIsTsumo] = useState(true)
  const [discarder, setDiscarder] = useState(null)
  const [riichis, setRiichis] = useState(riichiFlags ?? players.map(() => 'none'))
  const [han, setHan] = useState(null)
  const [fu, setFu] = useState(null)
  const [quickPoints, setQuickPoints] = useState(null)

  // Primary winner analyzer state
  const [analyzerResult, setAnalyzerResult] = useState(null)
  const [analyzerFuritenFlagged, setAnalyzerFuritenFlagged] = useState(false)
  const [analyzerWinOpts, setAnalyzerWinOpts] = useState(() => ({
    tsumo: true,
    riichi: false,
    ippatsu: false,
    doubleRiichi: false,
    lastTile: false,
    afterKan: false,
    bakaze: getRoundWind(round),
    jikaze: 27,
    doraIndicators: [],
    uraIndicators: [],
  }))

  // ── Co-winner state ───────────────────────────────────────────────────────
  // [{id, playerIndex, han, fu, quickPoints, analyzerResult, analyzerWinOpts}]
  const coWinnerIdRef = useRef(0)
  const [coWinners, setCoWinners] = useState([])

  // Tile tracking for cross-hand copy enforcement in analyzer mode
  // { 'primary': TileObject[], [coWinnerId]: TileObject[] }
  const [winnerTilesMap, setWinnerTilesMap] = useState({})

  const handleTilesChange = useCallback((slotKey, tiles, melds) => {
    const flat = [...tiles, ...melds.flatMap((m) => m.tiles)]
    setWinnerTilesMap((prev) => ({ ...prev, [slotKey]: flat }))
  }, [])

  function getOtherHandTiles(slotKey) {
    const key = String(slotKey)
    return Object.entries(winnerTilesMap)
      .filter(([k]) => k !== key)
      .flatMap(([, t]) => t)
  }

  // ── Sync effects ──────────────────────────────────────────────────────────

  // Sync primary analyzer jikaze when winner changes
  useEffect(() => {
    if (winner !== null) {
      setAnalyzerWinOpts((o) => ({ ...o, jikaze: getSeatWind(winner, dealer, numPlayers) }))
    }
  }, [winner, dealer, numPlayers])

  // Sync primary winner's riichi → analyzer
  useEffect(() => {
    if (localMode !== 'analyzer' || winner === null) return
    const r = riichis[winner]
    setAnalyzerWinOpts((o) => ({
      ...o,
      riichi: r === 'riichi' || r === 'double',
      doubleRiichi: r === 'double',
    }))
  }, [riichis, winner, localMode])

  // Sync co-winner riichi declarations → their analyzer win opts
  useEffect(() => {
    if (localMode !== 'analyzer') return
    setCoWinners((prev) =>
      prev.map((cw) => {
        if (cw.playerIndex === null) return cw
        const r = riichis[cw.playerIndex]
        return {
          ...cw,
          analyzerWinOpts: {
            ...cw.analyzerWinOpts,
            riichi: r === 'riichi' || r === 'double',
            doubleRiichi: r === 'double',
          },
        }
      })
    )
  }, [riichis, localMode])

  // Reset furiten flag when winner changes or win type switches
  useEffect(() => {
    setAnalyzerFuritenFlagged(false)
  }, [winner, analyzerWinOpts.tsumo])

  // Clear co-winners when switching to tsumo
  useEffect(() => {
    if (isTsumo) setCoWinners([])
  }, [isTsumo])

  // Remove co-winner entries that conflict with winner or discarder
  useEffect(() => {
    setCoWinners((prev) => prev.filter((cw) => cw.playerIndex !== winner && cw.playerIndex !== discarder))
  }, [winner, discarder])

  // In analyzer mode, tsumo/ron is controlled by the analyzer's WinOptions
  const effectiveIsTsumo = localMode === 'analyzer' ? analyzerWinOpts.tsumo : isTsumo

  function cycleRiichi(i) {
    setRiichis((prev) => {
      const n = [...prev]
      const curr = n[i]
      n[i] = isRiichiDeclared(curr) ? (curr === 'riichi' ? 'double' : 'none') : 'riichi'
      return n
    })
  }

  // ── Co-winner helpers ─────────────────────────────────────────────────────

  function addCoWinner() {
    const id = coWinnerIdRef.current++
    setCoWinners((prev) => [
      ...prev,
      {
        id,
        playerIndex: null,
        han: null,
        fu: null,
        quickPoints: null,
        analyzerResult: null,
        analyzerWinOpts: makeDefaultAnalyzerWinOpts(round),
      },
    ])
  }

  function removeCoWinner(id) {
    setCoWinners((prev) => prev.filter((cw) => cw.id !== id))
    setWinnerTilesMap((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function updateCoWinner(id, patch) {
    setCoWinners((prev) => prev.map((cw) => (cw.id === id ? { ...cw, ...patch } : cw)))
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const riichiSticks = riichis.filter(isRiichiDeclared).length
  const effectivePool = riichiPool + riichiSticks

  const isMultiRon = allowMultiRon && !effectiveIsTsumo && coWinners.length > 0 && discarder !== null
  const canAddCoWinner = allowMultiRon && !effectiveIsTsumo && winner !== null && discarder !== null && coWinners.length < numPlayers - 2

  // ── Payment calculation ───────────────────────────────────────────────────

  const payment = useMemo(() => {
    if (winner === null) return null

    // Multi-ron: sum per-winner payments, give pool to priority winner
    if (isMultiRon) {
      // Validate primary winner
      if (localMode === 'analyzer') {
        if (!analyzerResult?.isAgari || analyzerResult.noYaku) return null
      } else if (localMode === 'detailed') {
        if (han === null || fu === null) return null
      } else {
        if (quickPoints === null) return null
      }

      // Validate co-winners
      const coValid = coWinners.every((cw) => {
        if (cw.playerIndex === null) return false
        if (localMode === 'analyzer') return cw.analyzerResult?.isAgari && !cw.analyzerResult?.noYaku
        if (localMode === 'detailed') return cw.han !== null && cw.fu !== null
        return cw.quickPoints !== null
      })
      if (!coValid) return null

      // Priority winner: closest seat after discarder (receives riichi pool)
      let priorityWinner = winner
      let minDist = (winner - discarder + numPlayers) % numPlayers
      for (const cw of coWinners) {
        const dist = (cw.playerIndex - discarder + numPlayers) % numPlayers
        if (dist < minDist) { minDist = dist; priorityWinner = cw.playerIndex }
      }

      // Build unified entry list
      const allEntries = [
        {
          winnerIndex: winner,
          han: localMode === 'analyzer' ? analyzerResult.han : han,
          fu: localMode === 'analyzer' ? analyzerResult.fu : fu,
          quickPoints,
        },
        ...coWinners.map((cw) => ({
          winnerIndex: cw.playerIndex,
          han: localMode === 'analyzer' ? cw.analyzerResult.han : cw.han,
          fu: localMode === 'analyzer' ? cw.analyzerResult.fu : cw.fu,
          quickPoints: cw.quickPoints,
        })),
      ]

      const combined = new Array(numPlayers).fill(0)
      for (const entry of allEntries) {
        const isPriority = entry.winnerIndex === priorityWinner
        let entryDeltas

        if (localMode === 'quick') {
          entryDeltas = new Array(numPlayers).fill(0)
          const honbaBonus = honba * honbaValuePerPayer * (numPlayers - 1)
          entryDeltas[discarder] -= entry.quickPoints + honbaBonus
          entryDeltas[entry.winnerIndex] += entry.quickPoints + honbaBonus
          if (isPriority) entryDeltas[entry.winnerIndex] += effectivePool * riichiStickValue
        } else {
          const p = calculatePayments({
            han: entry.han, fu: entry.fu,
            isTsumo: false,
            winnerIndex: entry.winnerIndex,
            discarderIndex: discarder,
            dealerIndex: dealer,
            honba,
            riichiPool: isPriority ? effectivePool : 0,
            numPlayers, riichiStickValue, honbaValuePerPayer, kiriageMangan, kazoeYakumanPolicy,
          })
          entryDeltas = p.deltas
        }

        for (let i = 0; i < numPlayers; i++) combined[i] += entryDeltas[i]
      }

      return { deltas: combined, priorityWinner }
    }

    // Single winner, analyzer
    if (localMode === 'analyzer') {
      if (!analyzerResult?.isAgari || analyzerResult.noYaku) return null
      if (!analyzerWinOpts.tsumo && discarder === null) return null
      return calculatePayments({
        han: analyzerResult.han,
        fu: analyzerResult.fu,
        isTsumo: analyzerWinOpts.tsumo,
        winnerIndex: winner,
        discarderIndex: discarder,
        dealerIndex: dealer,
        honba,
        riichiPool: effectivePool,
        numPlayers,
        riichiStickValue,
        honbaValuePerPayer,
        kiriageMangan,
        kazoeYakumanPolicy,
      })
    }

    // Single winner, detailed
    if (localMode === 'detailed') {
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
        kiriageMangan,
        kazoeYakumanPolicy,
      })
    }

    // Single winner, quick
    if (quickPoints === null) return null
    if (!isTsumo && discarder === null) return null
    const deltas = new Array(numPlayers).fill(0)
    if (isTsumo) {
      const isWinnerDealer = winner === dealer
      const dealerPay = isWinnerDealer
        ? Math.ceil(quickPoints / (numPlayers - 1) / 100) * 100
        : Math.ceil(quickPoints / 2 / 100) * 100
      const nonDealerPay = isWinnerDealer ? dealerPay : Math.ceil(quickPoints / 4 / 100) * 100
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
  }, [winner, isTsumo, discarder, han, fu, quickPoints, honba, effectivePool, dealer, localMode, numPlayers, riichiStickValue, honbaValuePerPayer, kiriageMangan, kazoeYakumanPolicy, analyzerResult, analyzerWinOpts, coWinners, isMultiRon])

  // ── Confirm ───────────────────────────────────────────────────────────────

  function handleConfirm() {
    if (!payment || winner === null) return

    const snapshot = getSnapshot()

    const riichiDeltas = riichis.map((r) => (isRiichiDeclared(r) ? -riichiStickValue : 0))
    if (riichiDeltas.some((d) => d !== 0)) updateScores(riichiDeltas)

    updateScores(payment.deltas)
    setRiichiPool(0)

    const roundPrefix = formatRoundLabel(round, honba)
    const doubleRiichiNote = riichis.some((r) => r === 'double')
      ? ` [2立直: ${riichis.map((r, i) => r === 'double' ? players[i].name : null).filter(Boolean).join(', ')}]`
      : ''

    let label
    if (isMultiRon) {
      const allWinnerNames = [
        players[winner].name,
        ...coWinners.filter((cw) => cw.playerIndex !== null).map((cw) => players[cw.playerIndex].name),
      ]
      label = `${roundPrefix} · ${allWinnerNames.join(' & ')} ron from ${players[discarder].name}${doubleRiichiNote}`
    } else {
      const winType = effectiveIsTsumo ? 'tsumo' : `ron from ${players[discarder].name}`
      let handValue
      if (localMode === 'analyzer' && analyzerResult?.isAgari) {
        const yakuStr = formatYakuForLabel(analyzerResult.yaku, analyzerResult.yakuman)
        const scoreStr = formatHandValue(analyzerResult.han, analyzerResult.fu)
        handValue = yakuStr ? `${scoreStr} — ${yakuStr}` : scoreStr
      } else if (localMode === 'detailed') {
        handValue = formatHandValue(han, fu)
      } else {
        handValue = `${quickPoints?.toLocaleString()}pts`
      }
      label = `${roundPrefix} · ${players[winner].name} ${winType} · ${handValue}${doubleRiichiNote}`
    }

    addLogEntry({ snapshot, label, deltas: payment.deltas, type: 'win' })

    const isAnyWinnerDealer = winner === dealer || coWinners.some((cw) => cw.playerIndex === dealer)
    advanceAfterWin({ isDealer: isAnyWinnerDealer })
    onConfirm()
  }

  const coWinnersComplete = coWinners.every((cw) => {
    if (cw.playerIndex === null) return false
    if (localMode === 'analyzer') return cw.analyzerResult?.isAgari && !cw.analyzerResult?.noYaku
    if (localMode === 'quick') return cw.quickPoints !== null
    return cw.han !== null && cw.fu !== null
  })
  const canConfirm = payment !== null && winner !== null && (effectiveIsTsumo || discarder !== null) && coWinnersComplete

  const analyzerReady = localMode === 'analyzer' && analyzerResult?.isAgari && !analyzerResult.noYaku

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 py-4 space-y-5 max-w-md mx-auto pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100">Record Win</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 text-sm">Cancel</button>
      </div>

      {/* Entry mode tabs */}
      <div className="flex gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
        {[
          { id: 'detailed', label: 'Detailed' },
          { id: 'quick',    label: 'Quick' },
          { id: 'analyzer', label: 'Analyzer' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setLocalMode(id)}
            className={[
              'flex-1 py-1.5 text-sm font-medium rounded transition-colors',
              localMode === id ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Honba / pool info */}
      {(honba > 0 || riichiPool > 0) && (
        <div className="flex gap-2 text-xs text-slate-400">
          {honba > 0 && <span>{honba} honba (+{honba * honbaValuePerPayer}/player bonus)</span>}
          {riichiPool > 0 && <span>Pool: {(riichiPool * riichiStickValue).toLocaleString()}pts</span>}
        </div>
      )}

      <Section title={isMultiRon ? 'Winner 1' : 'Winner'}>
        <div className="flex gap-2">
          {players.map((p, i) => (
            <PlayerBtn key={i} player={p} selected={winner === i} onClick={() => setWinner(i)} color="sky" />
          ))}
        </div>
      </Section>

      {/* Win Type */}
      <Section title="Win Type">
        <div className="flex gap-2">
          {[{ v: true, l: 'Tsumo' }, { v: false, l: 'Ron' }].map(({ v, l }) => (
            <button
              key={l}
              onClick={() => {
                if (localMode === 'analyzer') {
                  setAnalyzerWinOpts((o) => ({ ...o, tsumo: v }))
                } else {
                  setIsTsumo(v)
                }
              }}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                effectiveIsTsumo === v ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </Section>

      {/* Discarder — shown for ron in all modes */}
      {!effectiveIsTsumo && (
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

      {/* Co-winners — visible whenever multiple ron is allowed and ron is active */}
      {(canAddCoWinner || coWinners.length > 0) && !effectiveIsTsumo && (
        <div className="space-y-3">
          {coWinners.map((cw, idx) => {
            const cwTaken = new Set([
              ...(winner !== null ? [winner] : []),
              ...(discarder !== null ? [discarder] : []),
              ...coWinners.filter((c) => c.id !== cw.id && c.playerIndex !== null).map((c) => c.playerIndex),
            ])
            const cwReady = cw.analyzerResult?.isAgari && !cw.analyzerResult?.noYaku

            return (
              <div key={cw.id} className="rounded-lg border border-slate-600 bg-slate-800/40 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Winner {idx + 2}</span>
                  <button
                    onClick={() => removeCoWinner(cw.id)}
                    className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>

                {/* Player selector */}
                <div className="flex gap-2">
                  {players.map((p, i) => (
                    <PlayerBtn
                      key={i} player={p}
                      selected={cw.playerIndex === i}
                      disabled={cwTaken.has(i)}
                      onClick={() => {
                        if (cwTaken.has(i)) return
                        updateCoWinner(cw.id, {
                          playerIndex: i,
                          analyzerWinOpts: {
                            ...cw.analyzerWinOpts,
                            jikaze: getSeatWind(i, dealer, numPlayers),
                          },
                        })
                      }}
                      color="sky"
                    />
                  ))}
                </div>

                {/* Hand value entry — full analyzer panel in analyzer mode */}
                {localMode === 'analyzer' ? (
                  <>
                    <AnalyzerEntryPanel
                      winOpts={cw.analyzerWinOpts}
                      onWinOptsChange={(opts) =>
                        updateCoWinner(cw.id, { analyzerWinOpts: { ...opts, tsumo: false } })
                      }
                      rules={rules}
                      onResult={(result) => updateCoWinner(cw.id, { analyzerResult: result })}
                      otherHandTiles={getOtherHandTiles(cw.id)}
                      onTilesChange={(tiles, melds) => handleTilesChange(cw.id, tiles, melds)}
                      hideRiichi
                      showTsumoToggle={false}
                    />
                    {cwReady && (
                      <>
                        <YakuList yaku={cw.analyzerResult.yaku} yakuman={cw.analyzerResult.yakuman} />
                        <ScorePanel
                          han={cw.analyzerResult.han}
                          fu={cw.analyzerResult.fu}
                          ten={cw.analyzerResult.ten}
                          outgoingTen={cw.analyzerResult.outgoingTen}
                          isTsumo={false}
                          fuBreakdown={cw.analyzerResult.fuBreakdown}
                          yakuman={cw.analyzerResult.yakuman ?? 0}
                        />
                      </>
                    )}
                    {cw.analyzerResult?.isAgari && cw.analyzerResult?.noYaku && (
                      <div className="rounded-lg border border-amber-800 bg-amber-900/20 px-3 py-2 text-sm text-amber-400">
                        Complete shape but no yaku — hand cannot be scored.
                      </div>
                    )}
                  </>
                ) : localMode === 'detailed' ? (
                  <>
                    <div>
                      <div className="text-[10px] text-slate-500 mb-1.5">Han</div>
                      <div className="flex flex-wrap gap-1.5">
                        {HAN_OPTIONS.map((h) => (
                          <button
                            key={h}
                            onClick={() => updateCoWinner(cw.id, { han: h })}
                            className={`h-8 rounded border text-xs font-bold transition-colors px-1.5 ${h >= 13 ? 'min-w-[4rem]' : 'w-8'} ${
                              cw.han === h
                                ? h >= 13 ? 'bg-amber-700 border-amber-500 text-white' : 'bg-sky-700 border-sky-500 text-white'
                                : 'bg-slate-800 border-slate-600 text-slate-300'
                            }`}
                          >
                            {HAN_LABEL[h] ?? h}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 mb-1.5">Fu</div>
                      <div className="flex flex-wrap gap-1.5">
                        {FU_OPTIONS.map((f) => (
                          <button
                            key={f}
                            onClick={() => updateCoWinner(cw.id, { fu: f })}
                            className={`w-10 h-8 rounded border text-xs font-bold transition-colors ${
                              cw.fu === f ? 'bg-violet-700 border-violet-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="text-[10px] text-slate-500 mb-1.5">Points</div>
                    <div className="flex flex-wrap gap-1.5">
                      {quickPointOptions.map((pts) => (
                        <button
                          key={pts}
                          onClick={() => updateCoWinner(cw.id, { quickPoints: pts })}
                          className={`px-2 h-8 rounded border text-xs font-bold transition-colors ${
                            cw.quickPoints === pts ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'
                          }`}
                        >
                          {pts.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {canAddCoWinner && (
            <button
              onClick={addCoWinner}
              className="w-full py-2 rounded-lg border border-dashed border-slate-600 text-xs text-slate-500 hover:border-sky-600 hover:text-sky-400 transition-colors"
            >
              + Add co-winner (double/triple ron)
            </button>
          )}
        </div>
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

      {/* ── Primary winner entry ── */}

      {localMode === 'detailed' && (
        <>
          <Section title="Han">
            {isMultiRon && winner !== null && (
              <p className="text-[11px] text-slate-500">{players[winner].name}'s hand</p>
            )}
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
      )}

      {localMode === 'quick' && (
        <Section title="Points">
          {isMultiRon && winner !== null && (
            <p className="text-[11px] text-slate-500">{players[winner].name}'s hand</p>
          )}
          <div className="flex flex-wrap gap-2">
            {quickPointOptions.map((pts) => (
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

      {localMode === 'analyzer' && (
        <div className="space-y-3">
          {isMultiRon && winner !== null && (
            <p className="text-[11px] text-slate-500 -mb-1">{players[winner].name}'s hand</p>
          )}
          <AnalyzerEntryPanel
            winOpts={analyzerWinOpts}
            onWinOptsChange={setAnalyzerWinOpts}
            rules={rules}
            onResult={setAnalyzerResult}
            otherHandTiles={isMultiRon ? getOtherHandTiles('primary') : []}
            onTilesChange={isMultiRon ? (t, m) => handleTilesChange('primary', t, m) : undefined}
            hideRiichi
            showTsumoToggle={false}
          />

          {analyzerReady && (
            <>
              <YakuList yaku={analyzerResult.yaku} yakuman={analyzerResult.yakuman} />
              <ScorePanel
                han={analyzerResult.han}
                fu={analyzerResult.fu}
                ten={analyzerResult.ten}
                outgoingTen={analyzerResult.outgoingTen}
                isTsumo={analyzerWinOpts.tsumo}
                fuBreakdown={analyzerResult.fuBreakdown}
                yakuman={analyzerResult.yakuman ?? 0}
              />
              {!analyzerWinOpts.tsumo && analyzerResult.ronTile && (
                <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <TileDisplay tile={analyzerResult.ronTile} size="sm" />
                    <span className="text-xs text-slate-400 flex-1">
                      Has <span className="text-slate-200 font-medium">{winner !== null ? players[winner].name : 'the winner'}</span> previously discarded this tile?
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAnalyzerFuritenFlagged(false)}
                      className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                        !analyzerFuritenFlagged
                          ? 'bg-slate-700 border-slate-500 text-slate-100'
                          : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      No
                    </button>
                    <button
                      onClick={() => setAnalyzerFuritenFlagged(true)}
                      className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                        analyzerFuritenFlagged
                          ? 'bg-rose-800 border-rose-600 text-white'
                          : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-rose-700 hover:text-rose-400'
                      }`}
                    >
                      Yes
                    </button>
                  </div>
                  {analyzerFuritenFlagged && (
                    <div className="rounded border border-rose-700 bg-rose-900/20 px-3 py-2 text-xs text-rose-300">
                      Furiten — this ron is likely invalid. The winner previously discarded the winning tile; they may only win by tsumo.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {analyzerResult?.isAgari && analyzerResult?.noYaku && (
            <div className="rounded-lg border border-amber-800 bg-amber-900/20 px-3 py-2 text-sm text-amber-400">
              Complete shape but no yaku — hand cannot be scored.
            </div>
          )}
        </div>
      )}

      {/* Payment preview */}
      {payment && (
        <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-300">
          <div className="font-semibold text-slate-200 mb-1">Payment Preview</div>
          {formatDeltas(payment.deltas, players)}
          {isMultiRon && payment.priorityWinner !== undefined && (
            <p className="mt-1 text-slate-500">
              Riichi pool → {players[payment.priorityWinner].name}
            </p>
          )}
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
