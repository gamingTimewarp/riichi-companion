export const WINDS = [
  { label: 'E', value: 27 },
  { label: 'S', value: 28 },
  { label: 'W', value: 29 },
  { label: 'N', value: 30 },
]

const btnBase = 'px-2.5 py-1 rounded text-xs font-medium border transition-colors'
const active   = 'bg-sky-700 border-sky-500 text-sky-100'
const inactive = 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'
const wActive  = 'bg-violet-800 border-violet-600 text-violet-100'
const wInact   = 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'

export default function WinOptions({ opts, onChange, show14, showTsumoToggle = true, hideRiichi = false }) {
  function toggle(key) {
    const next = { ...opts, [key]: !opts[key] }
    if (key === 'riichi' && !next.riichi) { next.ippatsu = false; next.doubleRiichi = false }
    if (key === 'doubleRiichi' && next.doubleRiichi) next.riichi = true
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-500 mr-1">Options:</span>

        {showTsumoToggle && show14 && (
          <button
            className={`${btnBase} ${opts.tsumo ? active : inactive}`}
            onClick={() => onChange({ ...opts, tsumo: !opts.tsumo })}
          >
            {opts.tsumo ? 'Tsumo' : 'Ron'}
          </button>
        )}

        {!hideRiichi && (
          <button className={`${btnBase} ${opts.riichi ? active : inactive}`} onClick={() => toggle('riichi')}>
            Riichi
          </button>
        )}

        {opts.riichi && (
          <>
            {!hideRiichi && (
              <button className={`${btnBase} ${opts.doubleRiichi ? active : inactive}`} onClick={() => toggle('doubleRiichi')}>
                Double
              </button>
            )}
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
