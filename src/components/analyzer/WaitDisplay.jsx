import { riichiIntToTile, tileToRiichi } from '../../lib/tiles.js'
import { getWaitTypes } from '../../lib/fuCalc.js'
import TileDisplay from '../tiles/TileDisplay.jsx'

// Build a frequency map: riichi-int → count from an array of TileObjects
function indicatorIntCounts(indicators) {
  const counts = {}
  for (const t of indicators) {
    const id = tileToRiichi(t)
    counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
}

const WAIT_LABEL = {
  ryanmen: 'Ryanmen',
  shanpon: 'Shanpon',
  kanchan: 'Kanchan',
  penchan: 'Penchan',
  tanki: 'Tanki',
}

const WAIT_DESC = {
  ryanmen: 'two-sided',
  shanpon: 'dual pair',
  kanchan: 'middle',
  penchan: 'edge',
  tanki: 'pair wait',
}

/**
 * Props:
 *   waits           — int[]         riichi-ts tile integers
 *   tiles           — TileObject[]  current hand (13 tiles)
 *   revealed        — boolean       false = hidden for learning mode
 *   onReveal        — () => void
 *   doraIndicators  — TileObject[]  face-up dora indicators (reduce pool)
 *   uraIndicators   — TileObject[]  revealed ura indicators (reduce pool)
 *   furitenInts     — Set<number>   wait ints that appear in "Your" discards (furiten)
 */
export default function WaitDisplay({ waits, tiles, revealed, onReveal, doraIndicators = [], uraIndicators = [], furitenInts = new Set() }) {
  if (!waits || waits.length === 0) return null

  // All visible indicator tiles reduce the remaining pool for that tile type
  const indicatorCounts = indicatorIntCounts([...doraIndicators, ...uraIndicators])

  function remaining(waitInt) {
    const inHand = tiles.filter((t) => tileToRiichi(t) === waitInt).length
    const inIndicators = indicatorCounts[waitInt] ?? 0
    return Math.max(0, 4 - inHand - inIndicators)
  }

  const totalRemaining = waits.reduce((sum, w) => sum + remaining(w), 0)

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-green-400">Waiting on</span>
        <span className="text-xs text-slate-500">{totalRemaining} tile{totalRemaining !== 1 ? 's' : ''} remaining</span>
      </div>

      {revealed ? (
        <div className="flex flex-wrap gap-2 items-end">
          {waits.map((w) => {
            const tile = riichiIntToTile(w)
            const rem = remaining(w)
            const types = getWaitTypes(tiles, w)
            const isFuriten = furitenInts.has(w)
            return (
              <div key={w} className={`flex flex-col items-center gap-0.5 rounded-lg p-1 ${isFuriten ? 'bg-rose-900/30 ring-1 ring-rose-700' : ''}`}>
                <TileDisplay tile={tile} size="md" />
                <span className="text-[10px] text-slate-500">{rem} left</span>
                {isFuriten && (
                  <span className="text-[10px] text-rose-400 font-bold leading-tight">furiten</span>
                )}
                {types.map((t) => (
                  <span key={t} className={`text-[10px] leading-tight ${isFuriten ? 'text-rose-400/60' : 'text-green-500/80'}`}>
                    {WAIT_LABEL[t]} · {WAIT_DESC[t]}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      ) : (
        <button
          onClick={onReveal}
          className="w-full py-2 rounded border border-dashed border-green-700 text-green-500 text-sm font-medium hover:bg-green-900/20 transition-colors"
        >
          Reveal waits
        </button>
      )}
    </div>
  )
}
