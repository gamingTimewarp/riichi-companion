import { tileToUnicode, tileLabel } from '../../lib/tiles.js'

const SUIT_STYLE = {
  m: 'bg-rose-900/50 border-rose-700 text-rose-200',
  p: 'bg-sky-900/50 border-sky-700 text-sky-200',
  s: 'bg-emerald-900/50 border-emerald-700 text-emerald-200',
  z: 'bg-violet-900/50 border-violet-700 text-violet-200',
}

const SIZE = {
  sm: { wrap: 'w-7 h-9',  text: 'text-lg',  badge: 'text-[9px] w-3.5 h-3.5' },
  md: { wrap: 'w-9 h-11', text: 'text-2xl', badge: 'text-[10px] w-4 h-4' },
  lg: { wrap: 'w-11 h-14', text: 'text-3xl', badge: 'text-xs w-5 h-5' },
}

/**
 * A single mahjong tile rendered as a Unicode character.
 *
 * Props:
 *   tile     — { suit, value, isAka }
 *   size     — 'sm' | 'md' | 'lg'  (default 'md')
 *   count    — number shown as badge (omit / 0 to hide)
 *   disabled — grey out and disable pointer events
 *   onClick  — click handler
 *   className — extra classes
 */
export default function TileDisplay({ tile, size = 'md', count, disabled, onClick, className = '' }) {
  const unicode = tileToUnicode(tile)
  const suitStyle = SUIT_STYLE[tile.suit] ?? SUIT_STYLE.z
  const s = SIZE[size] ?? SIZE.md

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tileLabel(tile)}
      aria-label={tileLabel(tile)}
      className={[
        'relative flex items-center justify-center rounded border select-none transition-all',
        suitStyle,
        s.wrap,
        tile.isAka ? 'ring-1 ring-red-400' : '',
        disabled
          ? 'opacity-35 cursor-not-allowed'
          : onClick
            ? 'hover:brightness-125 active:scale-90 cursor-pointer'
            : 'cursor-default',
        className,
      ].join(' ')}
    >
      <span className={`${s.text} leading-none`}>{unicode}</span>

      {count > 0 && (
        <span
          className={`absolute -top-1 -right-1 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center ${s.badge}`}
        >
          {count}
        </span>
      )}
    </button>
  )
}
