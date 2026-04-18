import { useState, useEffect } from 'react'
import useHandStore from '../../stores/handStore.js'
import useProfileStore from '../../stores/profileStore.js'
import { analyseHand, augmentNukidora } from '../../lib/analysis.js'
import useGameStore from '../../stores/gameStore.js'
import { tileToUnicode, riichiIntToTile, tileToRiichi } from '../../lib/tiles.js'
import HandDisplay from '../hand/HandDisplay.jsx'
import TextNotationInput from '../hand/TextNotationInput.jsx'
import TilePicker from '../tiles/TilePicker.jsx'
import WaitDisplay from './WaitDisplay.jsx'
import YakuList from './YakuList.jsx'
import ScorePanel from './ScorePanel.jsx'
import MeldEntry from './MeldEntry.jsx'
import DiscardTracker from './DiscardTracker.jsx'
import WinOptions from './WinOptions.jsx'
import DoraSelector from './DoraSelector.jsx'
import PracticeSession from '../practice/PracticeSession.jsx'

// ── Shanten status badge ──────────────────────────────────────────────────────

function ShantenBadge({ shanten, tileCount, meldCount }) {
  const totalTiles = tileCount + meldCount * 3
  // Don't show misleading analysis for partial hands (< 13 effective tiles)
  if (totalTiles < 13 && shanten !== Infinity) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2">
        <span className="text-sm text-slate-500">
          {totalTiles} / 13 tiles — keep adding tiles to analyse
        </span>
      </div>
    )
  }

  let label, colorClass
  if (shanten === -1) {
    label = 'Complete hand'
    colorClass = 'bg-sky-900/60 text-sky-300 border-sky-700'
  } else if (shanten === 0) {
    label = 'Tenpai'
    colorClass = 'bg-green-900/60 text-green-300 border-green-700'
  } else if (shanten === Infinity) {
    // riichi-ts bailed (e.g. tile count divisible by 3) or no tiles yet
    return null
  } else {
    label = `${shanten} away from tenpai`
    colorClass = 'bg-amber-900/40 text-amber-300 border-amber-700'
  }

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${colorClass}`}>
      <span className="text-sm font-semibold">{label}</span>
      <span className="ml-auto text-xs opacity-70">{totalTiles} tiles</span>
    </div>
  )
}

// ── Tab button ────────────────────────────────────────────────────────────────

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex-1 py-1.5 text-sm font-medium rounded transition-colors',
        active ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

// ── Learning mode toggle ──────────────────────────────────────────────────────

function ModeToggle() {
  const { mode, setMode, toggles, setToggle } = useProfileStore()
  const isLearning = mode === 'learning'
  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={() => setMode(isLearning ? 'casual' : 'learning')}
        className={[
          'flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition-colors',
          isLearning
            ? 'bg-violet-800 border-violet-600 text-violet-200'
            : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300',
        ].join(' ')}
        title={isLearning ? 'Learning mode: waits are hidden until you tap Reveal' : 'Switch to learning mode'}
      >
        {isLearning ? '📖 Learning' : '📖 Casual'}
      </button>
      {isLearning && (
        <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={toggles?.learningConfirmFlow ?? false}
            onChange={(e) => setToggle('learningConfirmFlow', e.target.checked)}
            className="accent-violet-500"
          />
          Hide score
        </label>
      )}
    </div>
  )
}

// ── Top-level mode tabs (Analyze | Practice) ─────────────────────────────────

function ModeTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors',
        active
          ? 'bg-sky-700 text-white'
          : 'text-slate-400 hover:text-slate-200',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AnalyzerMode() {
  const [analyzerTab, setAnalyzerTab] = useState('analyze')
  const {
    tiles, addTile, removeTile, setTiles, clearHand,
    melds, addMeld, removeMeld,
    analysisResult, setAnalysisResult,
    playerDiscards,
  } = useHandStore()
  const { mode, toggles } = useProfileStore()
  const rules = useGameStore((s) => s.rules)
  const numPlayers = useGameStore((s) => s.numPlayers)
  const allowAka = rules?.redDoraEnabled ?? true
  const redFives = rules?.redFives ?? { m: 1, p: 1, s: 1 }
  const openTanyao = rules?.openTanyao ?? true

  const [inputMode, setInputMode] = useState('picker')
  const [winOpts, setWinOpts] = useState({ tsumo: true, riichi: false, ippatsu: false, doubleRiichi: false, lastTile: false, afterKan: false, bakaze: 27, jikaze: 27, doraIndicators: [], uraIndicators: [] })
  const [revealState, setRevealState] = useState({ key: '', revealed: true })
  const [textKey, setTextKey] = useState(0)

  // Meld selection state
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIndices, setSelectedIndices] = useState(new Set())
  const [nukidoraCount, setNukidoraCount] = useState(0)
  const [extraDoraCount, setExtraDoraCount] = useState(0)

  function handleClearHand() {
    clearHand()
    setNukidoraCount(0)
    setExtraDoraCount(0)
  }

  // Each meld occupies 3 effective tile slots (pon, chi, or kan — same for riichi-ts)
  const maxClosedTiles = 14 - melds.length * 3

  // Run analysis when tiles, melds, or options change
  useEffect(() => {
    if (tiles.length === 0 && melds.length === 0) {
      setAnalysisResult(null)
      return
    }
    const result = analyseHand(tiles, {
      ...winOpts,
      melds,
      kuitan: openTanyao,
      allowAka,
      redFives,
      numPlayers,
    })
    setAnalysisResult(augmentNukidora(result, nukidoraCount, winOpts, { ...rules, numPlayers }, extraDoraCount))
  }, [tiles, melds, winOpts, openTanyao, allowAka, redFives, nukidoraCount, extraDoraCount]) // eslint-disable-line react-hooks/exhaustive-deps

  const revealKey = `${mode}|${tiles.map((t) => `${t.suit}${t.value}${t.isAka ? 'r' : ''}`).join(',')}|${melds.length}`
  const revealed = mode !== 'learning' || (revealState.key === revealKey && revealState.revealed)

  const result = analysisResult
  const shanten = result?.shanten ?? Infinity
  const isComplete = shanten === -1
  const isTenpai   = shanten === 0
  const totalTiles = tiles.length + melds.length * 3

  // Furiten: any of "Your" (player 0) discards match a current wait tile
  const yourDiscardInts = new Set(playerDiscards[0].tiles.map(tileToRiichi))
  const furitenInts = isTenpai && result?.waits
    ? new Set(result.waits.filter((w) => yourDiscardInts.has(w)))
    : new Set()

  // Aggregate discard counts across all players — used by WaitDisplay to show
  // accurate remaining-tile counts once discard data has been entered.
  const discardedCounts = {}
  for (const player of playerDiscards) {
    for (const tile of player.tiles) {
      const id = tileToRiichi(tile)
      discardedCounts[id] = (discardedCounts[id] ?? 0) + 1
    }
  }

  // Ron furiten: 14-tile hand analyzed as ron where the claimed tile is in own discards
  const isRon = !winOpts.tsumo && totalTiles >= 14
  const ronTileInt = isRon && tiles.length > 0 ? tileToRiichi(tiles[tiles.length - 1]) : null
  const isRonFuriten = isRon && ronTileInt !== null && yourDiscardInts.has(ronTileInt)

  function switchTo(m) {
    if (m === 'text') setTextKey((k) => k + 1)
    setInputMode(m)
  }

  // Derived pending tiles from selected indices
  const pendingTiles = [...selectedIndices].map((i) => tiles[i])

  function onToggleSelect(i) {
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(i)) {
        next.delete(i)
      } else {
        next.add(i)
      }
      return next
    })
  }

  function onStartSelect() {
    setIsSelecting(true)
    setSelectedIndices(new Set())
  }

  function onCancelSelect() {
    setIsSelecting(false)
    setSelectedIndices(new Set())
  }

  function onConfirmMeld(meld) {
    if (meld.type === 'nukidora' || meld.type === 'extradora') {
      setTiles(tiles.filter((_, i) => !selectedIndices.has(i)))
      if (meld.type === 'nukidora') setNukidoraCount((n) => n + 1)
      else setExtraDoraCount((n) => n + 1)
      setIsSelecting(false)
      setSelectedIndices(new Set())
      return
    }

    let remaining = tiles.filter((_, i) => !selectedIndices.has(i))
    // Open kan fabricates a 4th tile — if a matching tile is still in the
    // closed hand (all 4 copies were there), remove it too.
    if (meld.open && meld.tiles.length === 4) {
      const ref = meld.tiles[0]
      const extraIdx = remaining.findIndex((t) => t.suit === ref.suit && t.value === ref.value)
      if (extraIdx !== -1) remaining = remaining.filter((_, i) => i !== extraIdx)
    }
    setTiles(remaining)
    addMeld(meld)
    setIsSelecting(false)
    setSelectedIndices(new Set())
  }

  return (
    <div className="flex flex-col gap-4 p-3 max-w-lg mx-auto">

      {/* Top tab bar */}
      <div className="flex gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
        <ModeTab label="Analyze" active={analyzerTab === 'analyze'} onClick={() => setAnalyzerTab('analyze')} />
        <ModeTab label="Practice" active={analyzerTab === 'practice'} onClick={() => setAnalyzerTab('practice')} />
      </div>

      {/* Practice mode */}
      {analyzerTab === 'practice' && <PracticeSession />}

      {/* Analyze mode — everything below is only shown when analyze tab is active */}
      {analyzerTab === 'analyze' && <>

      {/* Header row: hand info + mode toggle */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <HandDisplay
            tiles={tiles}
            onRemove={removeTile}
            onClear={handleClearHand}
            selectMode={isSelecting}
            selectedIndices={selectedIndices}
            onToggleSelect={onToggleSelect}
            maxTiles={maxClosedTiles}
          />
        </div>
        <ModeToggle />
      </div>

      {/* Shanten status */}
      {totalTiles > 0 && (
        <ShantenBadge shanten={shanten} tileCount={tiles.length} meldCount={melds.length} />
      )}

      {/* Kyuushu kyuuhai notice */}
      {result?.isKyuushu && (
        <div className="rounded-lg border border-amber-700 bg-amber-900/20 px-3 py-2 text-sm text-amber-300">
          <span className="font-semibold">Kyuushu kyuuhai</span>
          {' '}— 9+ different terminals &amp; honors. You may declare an abortive draw on your first draw.
        </div>
      )}

      {/* Win options (14 effective tiles only) */}
      {totalTiles > 0 && (
        <WinOptions opts={winOpts} onChange={setWinOpts} show14={totalTiles >= 14} />
      )}

      {/* Dora / Uradora indicators */}
      {totalTiles > 0 && (
        <div className="flex flex-col gap-2">
          <DoraSelector
            label="Dora"
            indicators={winOpts.doraIndicators}
            onChange={(v) => setWinOpts({ ...winOpts, doraIndicators: v })}
          />
          {winOpts.riichi && (
            <DoraSelector
              label="Ura"
              indicators={winOpts.uraIndicators}
              onChange={(v) => setWinOpts({ ...winOpts, uraIndicators: v })}
            />
          )}
        </div>
      )}

      {/* Discard tracking — always visible once tiles are entered */}
      {totalTiles > 0 && (
        <DiscardTracker waits={result?.waits ?? []} />
      )}

      {/* Open melds section — always visible */}
      <div>
        <MeldEntry
          melds={melds}
          onRemove={removeMeld}
          onStartSelect={onStartSelect}
          pendingTiles={pendingTiles}
          onConfirmMeld={onConfirmMeld}
          onCancelSelect={onCancelSelect}
          isSelecting={isSelecting}
        />
      </div>

      {nukidoraCount > 0 && (
        <div className="flex items-center gap-2 rounded border border-violet-700/50 bg-violet-900/10 px-3 py-1.5">
          <span className="text-base leading-none text-violet-300">北</span>
          <span className="text-xs text-violet-400">Nukidora ×{nukidoraCount}</span>
          <button
            onClick={() => setNukidoraCount((n) => Math.max(0, n - 1))}
            className="ml-auto text-xs text-slate-500 hover:text-rose-400 transition-colors"
          >−</button>
        </div>
      )}

      {extraDoraCount > 0 && (
        <div className="flex items-center gap-2 rounded border border-amber-700/50 bg-amber-900/10 px-3 py-1.5">
          <span className="text-base leading-none text-amber-300">花</span>
          <span className="text-xs text-amber-400">Extra Dora ×{extraDoraCount}</span>
          <button
            onClick={() => setExtraDoraCount((n) => Math.max(0, n - 1))}
            className="ml-auto text-xs text-slate-500 hover:text-rose-400 transition-colors"
          >−</button>
        </div>
      )}

      {/* Input tabs — only shown when not in selection mode */}
      {!isSelecting && (
        <>
          <div className="flex gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <Tab label="Tile Picker" active={inputMode === 'picker'} onClick={() => switchTo('picker')} />
            <Tab label="Text Input"  active={inputMode === 'text'}   onClick={() => switchTo('text')}   />
          </div>

          {/* Input area */}
          {inputMode === 'picker' ? (
            <TilePicker tiles={tiles} onAdd={addTile} maxTiles={maxClosedTiles} allowAka={allowAka} redFives={redFives} />
          ) : (
            <TextNotationInput key={textKey} tiles={tiles} onParse={(p) => setTiles(p)} />
          )}
        </>
      )}

      {isSelecting && (
        <div className="rounded-lg border border-amber-700/50 bg-amber-900/10 px-3 py-2 text-xs text-amber-400">
          Tap tiles in your hand above to select them for the meld.
        </div>
      )}

      {/* ── Analysis results ── */}

      {/* Tenpai waits */}
      {result && isTenpai && (
        <WaitDisplay
          waits={result.waits}
          tiles={tiles}
          revealed={revealed}
          onReveal={() => setRevealState({ key: revealKey, revealed: true })}
          doraIndicators={winOpts.doraIndicators}
          uraIndicators={winOpts.riichi ? winOpts.uraIndicators : []}
          furitenInts={furitenInts}
          discardedCounts={discardedCounts}
        />
      )}

      {/* Complete hand: yaku + score */}
      {result && isComplete && result.isAgari && !result.noYaku && !isRonFuriten && (
        mode === 'learning' && (toggles?.learningConfirmFlow ?? false) && !revealed ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
            <button
              onClick={() => setRevealState({ key: revealKey, revealed: true })}
              className="w-full py-2 rounded border border-dashed border-violet-700 text-violet-400 text-sm font-medium hover:bg-violet-900/20 transition-colors"
            >
              Reveal analysis
            </button>
          </div>
        ) : (
          <>
            <YakuList yaku={result.yaku} yakuman={result.yakuman} />
            <ScorePanel
              han={result.han}
              fu={result.fu}
              ten={result.ten}
              outgoingTen={result.outgoingTen}
              isTsumo={winOpts.tsumo}
              fuBreakdown={result?.fuBreakdown}
              yakuman={result.yakuman ?? 0}
            />
          </>
        )
      )}

      {/* Furiten: discard-based (tenpai but a wait is in your own discards) */}
      {furitenInts.size > 0 && (
        <div className="rounded-lg border border-rose-800 bg-rose-900/20 px-3 py-2 text-sm text-rose-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">Furiten</span>
            <span className="text-rose-200 text-base tracking-wide">
              {[...furitenInts].map((w) => tileToUnicode(riichiIntToTile(w))).join('')}
            </span>
            <span>{furitenInts.size === 1 ? 'is' : 'are'} in your discards — ron blocked; tsumo only.</span>
          </div>
        </div>
      )}

      {/* Furiten: ron tile is in own discards (complete 14-tile ron hand) */}
      {isRonFuriten && (
        <div className="rounded-lg border border-rose-800 bg-rose-900/20 px-3 py-2 text-sm text-rose-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">Invalid ron — furiten</span>
            <span className="text-rose-200 text-base">{tileToUnicode(riichiIntToTile(ronTileInt))}</span>
            <span>is in your discard pile. Switch to tsumo or remove that tile.</span>
          </div>
        </div>
      )}

      {/* 14-tile tenpai shape that isn't a winning hand */}
      {result && totalTiles >= 14 && !result.isAgari && isTenpai && furitenInts.size === 0 && (
        <div className="rounded-lg border border-rose-800 bg-rose-900/20 px-3 py-2 text-sm text-rose-400">
          Tenpai shape — but this tile doesn't complete the hand. Possible furiten, or try a different winning tile.
        </div>
      )}

      {/* Complete shape but no valid yaku */}
      {result && isComplete && result.noYaku && (
        <div className="rounded-lg border border-amber-800 bg-amber-900/20 px-3 py-2 text-sm text-amber-400">
          Complete shape but no yaku — add riichi, tanyao, or a yaku tile set to score.
        </div>
      )}

      {/* Error */}
      {result?.error && (
        <div className="rounded border border-rose-700 bg-rose-900/20 px-3 py-2 text-xs text-rose-400">
          Analysis error: {result.error}
        </div>
      )}

      </>}
    </div>
  )
}
