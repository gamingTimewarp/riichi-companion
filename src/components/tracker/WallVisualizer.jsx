/**
 * WallVisualizer
 *
 * Given a dice sum and number of players, renders:
 *   1. A birds-eye square table diagram showing which wall is broken.
 *   2. A detailed horizontal strip of the broken wall with every stack marked:
 *        - live (slate)   — drawn as normal
 *        - dead (amber)   — reserve / kan draw tiles
 *        - dora indicator (rose★) — the top tile that gets flipped face-up
 *   3. Wrap annotation when the dead wall crosses a wall corner (sum ≤ 6).
 *
 * Wall-break rules used:
 *   wallPlayer = ((sum - 1) % numPlayers) + 1   (1 = Dealer/East)
 *   breakFromLeft = 17 - sum                     (0-indexed; the Sth stack from the right)
 *   dead wall     = stacks [breakFromLeft … breakFromLeft+6]  (7 stacks, may wrap)
 *   dora indicator = TOP tile of stack (breakFromLeft + 2)    (3rd dead-wall stack)
 */

const STACKS = 17   // stacks per wall (2 tiles each = 34 tiles per wall)

// Player/wall names per seat (wallPlayer 1-indexed, 1 = Dealer)
const WALL_LABEL_4P = ['Dealer (E)', 'Right (S)', 'Across (W)', 'Left (N)']
const WALL_LABEL_3P = ['Dealer (E)', 'Right (S)', 'Across (W)']

// In the birds-eye square: Dealer=bottom, South=right, West=top, North=left
const SIDE_OF = { 1: 'bottom', 2: 'right', 3: 'top', 4: 'left' }

// Adjacent wall clockwise (the wall the dead wall "wraps into" for small sums)
const NEXT_CW_4P = { 1: 2, 2: 3, 3: 4, 4: 1 }
const NEXT_CW_3P = { 1: 2, 2: 3, 3: 1 }

function computeBreak(sum, numPlayers) {
  const wallPlayer   = ((sum - 1) % numPlayers) + 1
  const breakIdx     = STACKS - sum          // leftmost dead-wall stack (0-indexed from left)
  const doraIdx      = breakIdx + 2          // 3rd dead-wall stack
  const doraWraps    = doraIdx >= STACKS     // wraps onto adjacent wall
  const wrappedCount = Math.max(0, breakIdx + 7 - STACKS)  // stacks that cross into next wall
  const nextWall     = (numPlayers === 3 ? NEXT_CW_3P : NEXT_CW_4P)[wallPlayer]
  return { wallPlayer, breakIdx, doraIdx, doraWraps, wrappedCount, nextWall }
}

// ── Small birds-eye table overview ────────────────────────────────────────────

function TableOverview({ activeWall, numPlayers }) {
  const side = SIDE_OF[activeWall]
  const wallLabels = numPlayers === 3 ? WALL_LABEL_3P : WALL_LABEL_4P

  function wallClass(player) {
    return player === activeWall
      ? 'bg-sky-500 text-white'
      : 'bg-slate-700 text-slate-400'
  }

  return (
    <div className="flex flex-col items-center gap-0.5 select-none">
      {/* Top wall — West / Across (wallPlayer 3) */}
      <div className={`flex items-center justify-center rounded-sm text-[10px] font-medium px-2 py-1 w-28 ${wallClass(3)}`}>
        {wallLabels[2]}
      </div>

      <div className="flex items-center gap-0.5">
        {/* Left wall — North / Left (wallPlayer 4, 4P only) */}
        {numPlayers === 4 ? (
          <div className={`flex items-center justify-center rounded-sm text-[10px] font-medium py-1 w-10 h-8 ${wallClass(4)}`}>
            {wallLabels[3]}
          </div>
        ) : (
          <div className="w-10 h-8" />
        )}

        {/* Table interior */}
        <div className="w-20 h-8 rounded border border-slate-700 bg-slate-900/60 flex items-center justify-center">
          <span className="text-[9px] text-slate-600">table</span>
        </div>

        {/* Right wall — South / Right (wallPlayer 2) */}
        <div className={`flex items-center justify-center rounded-sm text-[10px] font-medium py-1 w-10 h-8 ${wallClass(2)}`}>
          {wallLabels[1]}
        </div>
      </div>

      {/* Bottom wall — East / Dealer (wallPlayer 1) */}
      <div className={`flex items-center justify-center rounded-sm text-[10px] font-medium px-2 py-1 w-28 ${wallClass(1)}`}>
        {wallLabels[0]}
      </div>
    </div>
  )
}

// ── Detailed stack strip ───────────────────────────────────────────────────────

function WallStrip({ breakIdx, doraIdx, doraWraps, wrappedCount, wallLabel }) {
  // Stack types for rendering
  function stackType(i) {
    if (i < breakIdx) return 'live'
    if (i <= breakIdx + 6 && i < STACKS) return 'dead'
    return 'live'  // shouldn't happen with clamped dead wall
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>← player's left</span>
        <span className="font-medium text-slate-200">{wallLabel}</span>
        <span>player's right →</span>
      </div>

      {/* Stack row */}
      <div className="flex items-end gap-px overflow-x-auto pb-1">
        {Array.from({ length: STACKS }, (_, i) => {
          const isDead   = i >= breakIdx && i < STACKS && i <= breakIdx + 6
          const isDora   = !doraWraps && i === doraIdx
          const isBreak  = i === breakIdx  // leftmost dead-wall stack = opening point

          const topClass = isDora
            ? 'bg-rose-500 ring-1 ring-rose-300'
            : isDead
            ? 'bg-amber-600'
            : 'bg-slate-600'

          const bottomClass = isDead ? 'bg-amber-800/70' : 'bg-slate-700'

          return (
            <div key={i} className="relative flex flex-col items-center gap-px flex-shrink-0">
              {/* Indicators above the stack */}
              <div className="h-4 flex items-end justify-center">
                {isDora && (
                  <span className="text-[8px] leading-none text-rose-300 font-bold">★</span>
                )}
                {isBreak && !isDora && (
                  <span className="text-[8px] leading-none text-sky-400">▼</span>
                )}
              </div>
              {/* Top tile */}
              <div className={`w-3 h-3.5 rounded-[2px] ${topClass} flex-shrink-0`} />
              {/* Bottom tile */}
              <div className={`w-3 h-3 rounded-[2px] ${bottomClass} flex-shrink-0`} />
              {/* Stack number label — only at a few key positions */}
              {(i === 0 || i === breakIdx || i === STACKS - 1) && (
                <span className="text-[8px] leading-none text-slate-600 mt-px">
                  {i + 1}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-600" />
          live
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-600" />
          dead wall
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-rose-500" />
          dora indicator (★ = flip face-up)
        </span>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function WallVisualizer({ sum, numPlayers = 4 }) {
  if (!sum) return null

  const {
    wallPlayer,
    breakIdx,
    doraIdx,
    doraWraps,
    wrappedCount,
    nextWall,
  } = computeBreak(sum, numPlayers)

  const wallLabels = numPlayers === 3 ? WALL_LABEL_3P : WALL_LABEL_4P
  const wallLabel  = wallLabels[wallPlayer - 1]
  const nextLabel  = wallLabels[nextWall - 1]

  // Dora position description
  let doraDesc
  if (doraWraps) {
    // doraIdx wrapped — it's on the adjacent wall
    const wrappedStack = doraIdx - STACKS + 1  // 1-indexed from left of next wall
    doraDesc = `Stack ${wrappedStack} from left of ${nextLabel}'s wall (3rd dead-wall stack, wraps over)`
  } else {
    const fromRight = STACKS - doraIdx  // 1-indexed from right
    doraDesc = `Stack ${fromRight} from right of this wall — top tile faces up`
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Birds-eye table diagram */}
      <div className="flex items-center gap-4">
        <TableOverview activeWall={wallPlayer} numPlayers={numPlayers} />
        <div className="flex-1 flex flex-col gap-1 text-xs text-slate-400 min-w-0">
          <div>
            <span className="text-white font-medium">{wallLabel}'s wall</span> is broken.
          </div>
          <div>
            Count <span className="text-sky-300 font-medium">{sum}</span> from the right —{' '}
            <span className="text-slate-300">{breakIdx}</span> stack{breakIdx !== 1 ? 's' : ''} to the left of the break draw first.
          </div>
          {wrappedCount > 0 && (
            <div className="text-amber-400">
              Dead wall wraps {wrappedCount} stack{wrappedCount > 1 ? 's' : ''} onto {nextLabel}'s wall.
            </div>
          )}
        </div>
      </div>

      {/* Detailed wall strip */}
      <WallStrip
        breakIdx={breakIdx}
        doraIdx={doraIdx}
        doraWraps={doraWraps}
        wrappedCount={wrappedCount}
        wallLabel={wallLabel}
      />

      {/* Dora indicator callout */}
      <div className="rounded-lg border border-rose-800/60 bg-rose-900/15 px-3 py-2 flex flex-col gap-0.5">
        <span className="text-[11px] font-semibold text-rose-300">Dora indicator</span>
        <span className="text-[11px] text-slate-300">{doraDesc}</span>
        {doraWraps && (
          <span className="text-[10px] text-amber-400 mt-0.5">
            The dead wall crosses into {nextLabel}'s wall — the indicator tile is on that wall.
          </span>
        )}
      </div>

    </div>
  )
}
