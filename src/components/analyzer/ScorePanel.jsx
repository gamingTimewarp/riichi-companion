function hanLabel(han, yakuman) {
  if (yakuman >= 2) return 'Double Yakuman'
  if (yakuman >= 1) return 'Yakuman'
  if (han >= 26) return 'Double Yakuman'
  if (han >= 13) return 'Kazoe Yakuman'
  if (han >= 11) return 'Sanbaiman'
  if (han >= 8)  return 'Baiman'
  if (han >= 6)  return 'Haneman'
  if (han >= 5)  return 'Mangan'
  return `${han} Han`
}

function pts(n) {
  return n?.toLocaleString() ?? '—'
}

/**
 * Displays the score breakdown for a complete hand.
 *
 * Props:
 *   han          — number
 *   fu           — number
 *   ten          — number  (total points won)
 *   outgoingTen  — { oya: number, ko: number } | undefined
 *   isTsumo      — boolean
 *   fuBreakdown  — { items: [{label, fu}], fu: number, rawFu?: number } | null
 */
export default function ScorePanel({ han, fu, ten, outgoingTen, isTsumo, fuBreakdown, yakuman = 0 }) {
  if (!han && !ten) return null
  const isLimit = han >= 5 || yakuman > 0

  return (
    <div className="rounded-lg border border-sky-800 bg-slate-800/60 p-3 flex flex-col gap-3">
      <span className="text-sm font-semibold text-sky-400">Score</span>

      {/* Han + Fu + win type badges */}
      <div className="flex gap-2 flex-wrap">
        <span className={`px-2 py-1 rounded text-sm font-mono font-semibold ${yakuman >= 1 ? 'bg-amber-900/50 text-amber-300' : 'bg-sky-900/50 text-sky-300'}`}>
          {hanLabel(han, yakuman)}
        </span>
        {!isLimit && fu > 0 && (
          <span className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-sm font-mono">
            {fu} Fu
          </span>
        )}
        <span className="px-2 py-1 rounded bg-slate-700 text-slate-400 text-xs self-center">
          {isTsumo ? 'Tsumo' : 'Ron'}
        </span>
      </div>

      {/* Fu breakdown section */}
      {!isLimit && fuBreakdown && fuBreakdown.items.length > 0 && (
        <div className="flex flex-col gap-1 rounded border border-slate-700 bg-slate-900/40 px-3 py-2">
          <span className="text-xs font-semibold text-slate-400 mb-1">Fu breakdown</span>
          {fuBreakdown.items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-slate-400">{item.label}</span>
              <span className="font-mono text-slate-300">{item.fu}</span>
            </div>
          ))}
          <div className="border-t border-slate-700 mt-1 pt-1 flex justify-between text-xs font-semibold">
            <span className="text-slate-300">
              Raw total
              {fuBreakdown.rawFu != null && fuBreakdown.rawFu !== fuBreakdown.fu
                ? ` (${fuBreakdown.rawFu} → rounded to ${fuBreakdown.fu})`
                : ''}
            </span>
            <span className="font-mono text-sky-300">{fuBreakdown.fu} fu</span>
          </div>
        </div>
      )}

      {/* Points breakdown */}
      {ten > 0 && (
        <div className="flex flex-col gap-1.5">
          {isTsumo && outgoingTen ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Dealer pays</span>
                <span className="font-mono font-semibold text-slate-100">{pts(outgoingTen.oya)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Non-dealer pays</span>
                <span className="font-mono font-semibold text-slate-100">{pts(outgoingTen.ko)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-700 pt-1.5">
                <span className="text-slate-400">Total received</span>
                <span className="font-mono font-bold text-sky-300">{pts(ten)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">{isTsumo ? 'Total received' : 'Ron payment'}</span>
              <span className="font-mono font-bold text-sky-300">{pts(ten)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
