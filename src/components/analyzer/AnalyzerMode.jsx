import { useState, useEffect } from 'react'
import useHandStore from '../../stores/handStore.js'
import useProfileStore from '../../stores/profileStore.js'
import { analyseHand } from '../../lib/analysis.js'
import { TILE_TYPES, tileToUnicode, riichiIntToTile } from '../../lib/tiles.js'
import HandDisplay from '../hand/HandDisplay.jsx'
import TextNotationInput from '../hand/TextNotationInput.jsx'
import TilePicker from '../tiles/TilePicker.jsx'
import WaitDisplay from './WaitDisplay.jsx'
import YakuList from './YakuList.jsx'
import ScorePanel from './ScorePanel.jsx'
import MeldEntry from './MeldEntry.jsx'
import DiscardTracker from './DiscardTracker.jsx'
import { tileToRiichi } from '../../lib/tiles.js'

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

// ── Win options row ───────────────────────────────────────────────────────────

const WINDS = [
  { label: 'E', value: 27 },
  { label: 'S', value: 28 },
  { label: 'W', value: 29 },
  { label: 'N', value: 30 },
]

function WinOptions({ opts, onChange, show14 }) {
  function toggle(key) {
    const next = { ...opts, [key]: !opts[key] }
    if (key === 'riichi' && !next.riichi) { next.ippatsu = false; next.doubleRiichi = false }
    if (key === 'doubleRiichi' && next.doubleRiichi) next.riichi = true
    onChange(next)
  }

  const btnBase = 'px-2.5 py-1 rounded text-xs font-medium border transition-colors'
  const active   = 'bg-sky-700 border-sky-500 text-sky-100'
  const inactive = 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'
  const wActive  = 'bg-violet-800 border-violet-600 text-violet-100'
  const wInact   = 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-500 mr-1">Options:</span>

        {show14 && (
          <button
            className={`${btnBase} ${opts.tsumo ? active : inactive}`}
            onClick={() => onChange({ ...opts, tsumo: !opts.tsumo })}
          >
            {opts.tsumo ? 'Tsumo' : 'Ron'}
          </button>
        )}

        <button className={`${btnBase} ${opts.riichi ? active : inactive}`} onClick={() => toggle('riichi')}>
          Riichi
        </button>

        {opts.riichi && (
          <>
            <button className={`${btnBase} ${opts.doubleRiichi ? active : inactive}`} onClick={() => toggle('doubleRiichi')}>
              Double
            </button>
            <button className={`${btnBase} ${opts.ippatsu ? active : inactive}`} onClick={() => toggle('ippatsu')}>
              Ippatsu
            </button>
          </>
        )}

        <button className={`${btnBase} ${opts.lastTile ? active : inactive}`} onClick={() => toggle('lastTile')}>
          Last tile
        </button>

        <button className={`${btnBase} ${opts.afterKan ? active : inactive}`} onClick={() => toggle('afterKan')}>
          After kan
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-500 mr-1">Seat:</span>
        {WINDS.map((w) => (
          <button
            key={w.value}
            className={`${btnBase} ${opts.jikaze === w.value ? wActive : wInact}`}
            onClick={() => onChange({ ...opts, jikaze: w.value })}
          >
            {w.label}
          </button>
        ))}
        <span className="text-xs text-slate-500 ml-2 mr-1">Round:</span>
        {WINDS.map((w) => (
          <button
            key={w.value}
            className={`${btnBase} ${opts.bakaze === w.value ? wActive : wInact}`}
            onClick={() => onChange({ ...opts, bakaze: w.value })}
          >
            {w.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Dora indicator selector ───────────────────────────────────────────────────

const SUIT_COLOR = { m: 'text-rose-300', p: 'text-sky-300', s: 'text-emerald-300', z: 'text-violet-300' }

// TILE_TYPES grouped by suit for the indicator picker grid
const INDICATOR_ROWS = ['m', 'p', 's', 'z'].map((suit) => ({
  suit,
  tiles: TILE_TYPES.filter((t) => t.suit === suit),
}))

function DoraSelector({ label, indicators, onChange }) {
  const [picking, setPicking] = useState(false)

  function add(tile) {
    onChange([...indicators, tile])
    setPicking(false)
  }

  function remove(i) {
    onChange(indicators.filter((_, idx) => idx !== i))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-slate-500 mr-0.5">{label}:</span>
        {indicators.map((t, i) => (
          <button
            key={i}
            onClick={() => remove(i)}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-600 bg-slate-700 hover:border-rose-500 text-sm leading-none transition-colors"
            title="Remove"
          >
            <span className={SUIT_COLOR[t.suit]}>{tileToUnicode(t)}</span>
            <span className="text-slate-500 text-xs">×</span>
          </button>
        ))}
        <button
          onClick={() => setPicking((p) => !p)}
          className="px-2 py-0.5 rounded border border-dashed border-slate-600 text-slate-500 text-xs hover:border-slate-400 hover:text-slate-300 transition-colors"
        >
          {picking ? 'cancel' : '+ indicator'}
        </button>
      </div>

      {picking && (
        <div className="flex flex-col gap-1 p-2 rounded border border-slate-700 bg-slate-900/60">
          {INDICATOR_ROWS.map((row) => (
            <div key={row.suit} className="flex flex-wrap gap-0.5">
              {row.tiles.map((t, i) => (
                <button
                  key={i}
                  onClick={() => add(t)}
                  className={`text-xl leading-none px-0.5 py-0.5 rounded hover:bg-slate-700 transition-colors ${SUIT_COLOR[t.suit]}`}
                >
                  {tileToUnicode(t)}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
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
  const { mode, setMode } = useProfileStore()
  const isLearning = mode === 'learning'
  return (
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
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AnalyzerMode() {
  const {
    tiles, addTile, removeTile, setTiles, clearHand,
    melds, addMeld, removeMeld,
    analysisResult, setAnalysisResult,
    playerDiscards,
  } = useHandStore()
  const { mode } = useProfileStore()

  const [inputMode, setInputMode] = useState('picker')
  const [winOpts, setWinOpts] = useState({ tsumo: true, riichi: false, ippatsu: false, doubleRiichi: false, lastTile: false, afterKan: false, bakaze: 27, jikaze: 27, doraIndicators: [], uraIndicators: [] })
  const [revealed, setRevealed] = useState(true)
  const [textKey, setTextKey] = useState(0)

  // Meld selection state
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIndices, setSelectedIndices] = useState(new Set())

  // Each meld occupies 3 effective tile slots (pon, chi, or kan — same for riichi-ts)
  const maxClosedTiles = 14 - melds.length * 3

  // Run analysis when tiles, melds, or options change
  useEffect(() => {
    if (tiles.length === 0 && melds.length === 0) {
      setAnalysisResult(null)
      return
    }
    setAnalysisResult(analyseHand(tiles, { ...winOpts, melds }))
  }, [tiles, melds, winOpts]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset reveal when tiles change (learning mode)
  useEffect(() => {
    setRevealed(mode !== 'learning')
  }, [tiles, mode])

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
    // Remove selected tiles from hand
    setTiles(tiles.filter((_, i) => !selectedIndices.has(i)))
    // Add the meld
    addMeld(meld)
    // Reset selection state
    setIsSelecting(false)
    setSelectedIndices(new Set())
  }

  return (
    <div className="flex flex-col gap-4 p-3 max-w-lg mx-auto">

      {/* Header row: hand info + mode toggle */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <HandDisplay
            tiles={tiles}
            onRemove={removeTile}
            onClear={clearHand}
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

      {/* Input tabs — only shown when not in selection mode */}
      {!isSelecting && (
        <>
          <div className="flex gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <Tab label="Tile Picker" active={inputMode === 'picker'} onClick={() => switchTo('picker')} />
            <Tab label="Text Input"  active={inputMode === 'text'}   onClick={() => switchTo('text')}   />
          </div>

          {/* Input area */}
          {inputMode === 'picker' ? (
            <TilePicker tiles={tiles} onAdd={addTile} maxTiles={maxClosedTiles} />
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
          onReveal={() => setRevealed(true)}
          doraIndicators={winOpts.doraIndicators}
          uraIndicators={winOpts.riichi ? winOpts.uraIndicators : []}
          furitenInts={furitenInts}
        />
      )}

      {/* Complete hand: yaku + score */}
      {result && isComplete && result.isAgari && !result.noYaku && !isRonFuriten && (
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
    </div>
  )
}
