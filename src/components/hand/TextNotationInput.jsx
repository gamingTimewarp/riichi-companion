import { useState, useEffect, useRef } from 'react'
import { parseNotation, tilesToNotation } from '../../lib/tiles.js'

/**
 * Text notation input with live parsing.
 *
 * Props:
 *   tiles    — TileObject[] (current hand, used to populate on first mount)
 *   onParse  — (tiles: TileObject[]) => void — called when parse succeeds with 0 errors
 */
export default function TextNotationInput({ tiles, onParse }) {
  const [text, setText] = useState('')
  const [errors, setErrors] = useState([])
  const initialized = useRef(false)

  // Pre-populate from current tiles when first shown
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      setText(tilesToNotation(tiles))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e) {
    const val = e.target.value
    setText(val)
    const { tiles: parsed, errors: errs } = parseNotation(val)
    setErrors(errs)
    if (errs.length === 0) {
      onParse(parsed)
    }
  }

  const hasErrors = errors.length > 0
  const tileCount = (() => {
    const { tiles: parsed, errors: errs } = parseNotation(text)
    return errs.length === 0 ? parsed.length : null
  })()

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          type="text"
          value={text}
          onChange={handleChange}
          placeholder="e.g. 123m456p789s11z"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          className={[
            'w-full rounded border bg-slate-800 px-3 py-2 text-slate-100',
            'font-mono text-sm placeholder:text-slate-600',
            'focus:outline-none focus:ring-2',
            hasErrors
              ? 'border-rose-600 focus:ring-rose-500/50'
              : 'border-slate-600 focus:ring-sky-500/50',
          ].join(' ')}
        />
        {tileCount !== null && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            {tileCount} tile{tileCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {hasErrors && (
        <ul className="text-xs text-rose-400 space-y-0.5 pl-1">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-600">
        Format: values then suit — <span className="text-slate-500">123m 456p 789s 11z</span>
        &ensp;·&ensp;Red fives: <span className="text-slate-500">0m 0p 0s</span>
        &ensp;·&ensp;Honors (z): 1–7
      </p>
    </div>
  )
}
