import { useState } from 'react'
import { TILE_TYPES, tileToUnicode, tileLabel } from '../../lib/tiles.js'

const SUIT_COLOR = { m: 'text-rose-300', p: 'text-sky-300', s: 'text-emerald-300', z: 'text-violet-300' }

const INDICATOR_ROWS = ['m', 'p', 's', 'z'].map((suit) => ({
  suit,
  tiles: TILE_TYPES.filter((t) => t.suit === suit),
}))

export default function DoraSelector({ label, indicators, onChange }) {
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
                  aria-label={tileLabel(t)}
                  className={`relative group text-xl leading-none px-0.5 py-0.5 rounded hover:bg-slate-700 transition-colors ${SUIT_COLOR[t.suit]}`}
                >
                  {tileToUnicode(t)}
                  <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-200 opacity-0 transition-opacity group-hover:opacity-100">
                    {tileLabel(t)}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
