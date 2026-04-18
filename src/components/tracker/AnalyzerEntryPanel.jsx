import { useState, useEffect } from 'react'
import { analyseHand, augmentNukidora } from '../../lib/analysis.js'
import useGameStore from '../../stores/gameStore.js'
import HandDisplay from '../hand/HandDisplay.jsx'
import TilePicker from '../tiles/TilePicker.jsx'
import MeldEntry from '../analyzer/MeldEntry.jsx'
import WinOptions from '../analyzer/WinOptions.jsx'
import DoraSelector from '../analyzer/DoraSelector.jsx'
import YakuList from '../analyzer/YakuList.jsx'
import ScorePanel from '../analyzer/ScorePanel.jsx'

/**
 * Embeds the tile-input + live analysis UI for use inside the tracker's
 * hand entry flow.
 *
 * Props:
 *   winOpts         — win options object (tsumo, riichi, winds, dora, …)
 *   onWinOptsChange — (newOpts) => void
 *   rules           — active game rules (openTanyao, redDoraEnabled, redFives)
 *   onResult        — (result | null) => void  — called on every analysis update
 *   otherHandTiles  — TileObject[] — tiles from other winners' hands; enforces
 *                     the shared 4-copy pool across all multiple-ron hands
 *   onTilesChange   — (tiles, melds) => void — notifies parent of tile state changes
 */
export default function AnalyzerEntryPanel({ winOpts, onWinOptsChange, rules, onResult, otherHandTiles = [], onTilesChange, hideRiichi = false, showTsumoToggle = true }) {
  const numPlayers = useGameStore((s) => s.numPlayers)
  const [tiles, setTiles] = useState([])
  const [melds, setMelds] = useState([])
  const [nukidoraCount, setNukidoraCount] = useState(0)
  const [extraDoraCount, setExtraDoraCount] = useState(0)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIndices, setSelectedIndices] = useState(new Set())

  const allowAka = rules?.redDoraEnabled ?? true
  const redFives = rules?.redFives ?? { m: 1, p: 1, s: 1 }
  const maxClosedTiles = 14 - melds.length * 3
  const totalTiles = tiles.length + melds.length * 3

  useEffect(() => {
    onTilesChange?.(tiles, melds)
    if (tiles.length === 0 && melds.length === 0) {
      onResult(null)
      return
    }
    const result = analyseHand(tiles, {
      ...winOpts,
      melds,
      kuitan: rules?.openTanyao ?? true,
      allowAka,
      redFives,
      numPlayers,
    })
    onResult(augmentNukidora(result, nukidoraCount, winOpts, { ...rules, numPlayers }, extraDoraCount))
  }, [tiles, melds, winOpts, rules, nukidoraCount, extraDoraCount]) // eslint-disable-line react-hooks/exhaustive-deps

  const pendingTiles = [...selectedIndices].map((i) => tiles[i])

  function addTile(tile) {
    if (tiles.length < maxClosedTiles) setTiles((prev) => [...prev, tile])
  }

  function removeTile(i) {
    setTiles((prev) => prev.filter((_, idx) => idx !== i))
  }

  function clearHand() {
    setTiles([])
    setMelds([])
    setNukidoraCount(0)
    setExtraDoraCount(0)
    setIsSelecting(false)
    setSelectedIndices(new Set())
  }

  function onToggleSelect(i) {
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  function onConfirmMeld(meld) {
    if (meld.type === 'nukidora' || meld.type === 'extradora') {
      setTiles((prev) => prev.filter((_, i) => !selectedIndices.has(i)))
      if (meld.type === 'nukidora') setNukidoraCount((n) => n + 1)
      else setExtraDoraCount((n) => n + 1)
      setIsSelecting(false)
      setSelectedIndices(new Set())
      return
    }

    setTiles((prev) => {
      let remaining = prev.filter((_, i) => !selectedIndices.has(i))
      // Open kan fabricates a 4th tile — if the hand still contains a matching
      // tile (i.e. all 4 copies were in the closed hand), remove it so the tile
      // count stays consistent.
      if (meld.open && meld.tiles.length === 4) {
        const ref = meld.tiles[0]
        const extraIdx = remaining.findIndex((t) => t.suit === ref.suit && t.value === ref.value)
        if (extraIdx !== -1) remaining = remaining.filter((_, i) => i !== extraIdx)
      }
      return remaining
    })
    setMelds((prev) => [...prev, meld])
    setIsSelecting(false)
    setSelectedIndices(new Set())
  }

  function onCancelSelect() {
    setIsSelecting(false)
    setSelectedIndices(new Set())
  }

  // Derive a simple status label
  let statusLabel = null
  let statusClass = 'border-slate-700 bg-slate-800/60 text-slate-400'
  if (totalTiles > 0 && totalTiles < 13) {
    statusLabel = `${totalTiles} / 13 tiles — keep adding`
  } else if (totalTiles >= 13) {
    // Run a quick shanten check via onResult; the parent holds the result
    // We just need to show a badge here — read it from the last known result
  }

  return (
    <div className="space-y-3">
      <HandDisplay
        tiles={tiles}
        onRemove={removeTile}
        onClear={clearHand}
        selectMode={isSelecting}
        selectedIndices={selectedIndices}
        onToggleSelect={onToggleSelect}
        maxTiles={maxClosedTiles}
      />

      <MeldEntry
        melds={melds}
        onRemove={(i) => setMelds((prev) => prev.filter((_, idx) => idx !== i))}
        onStartSelect={() => { setIsSelecting(true); setSelectedIndices(new Set()) }}
        pendingTiles={pendingTiles}
        onConfirmMeld={onConfirmMeld}
        onCancelSelect={onCancelSelect}
        isSelecting={isSelecting}
        allowNukidora={numPlayers === 3}
      />

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

      {isSelecting && (
        <div className="rounded-lg border border-amber-700/50 bg-amber-900/10 px-3 py-2 text-xs text-amber-400">
          Tap tiles in your hand above to select them for the meld.
        </div>
      )}

      {!isSelecting && (
        <TilePicker
          tiles={tiles}
          onAdd={addTile}
          maxTiles={maxClosedTiles}
          allowAka={allowAka}
          redFives={redFives}
          otherHandTiles={otherHandTiles}
        />
      )}

      {totalTiles > 0 && (
        <>
          <WinOptions
            opts={winOpts}
            onChange={onWinOptsChange}
            show14={totalTiles >= 14}
            showTsumoToggle={showTsumoToggle}
            hideRiichi={hideRiichi}
          />
          <div className="flex flex-col gap-2">
            <DoraSelector
              label="Dora"
              indicators={winOpts.doraIndicators}
              onChange={(v) => onWinOptsChange({ ...winOpts, doraIndicators: v })}
            />
            {winOpts.riichi && (
              <DoraSelector
                label="Ura"
                indicators={winOpts.uraIndicators}
                onChange={(v) => onWinOptsChange({ ...winOpts, uraIndicators: v })}
              />
            )}
          </div>
        </>
      )}

      {statusLabel && (
        <div className={`rounded-lg border px-3 py-2 text-xs ${statusClass}`}>
          {statusLabel}
        </div>
      )}
    </div>
  )
}
