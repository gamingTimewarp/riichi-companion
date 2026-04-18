import { useState, useMemo } from 'react'
import { generatePracticeHand } from '../../lib/practiceHands.js'
import { riichiIntToTile, tileToRiichi, tileToUnicode, tileLabel } from '../../lib/tiles.js'
import TileDisplay from '../tiles/TileDisplay.jsx'

// ── Tile rows for the guess picker ────────────────────────────────────────────

const MAN_TILES   = Array.from({ length: 9 }, (_, i) => ({ suit: 'm', value: i + 1, isAka: false }))
const PIN_TILES   = Array.from({ length: 9 }, (_, i) => ({ suit: 'p', value: i + 1, isAka: false }))
const SOU_TILES   = Array.from({ length: 9 }, (_, i) => ({ suit: 's', value: i + 1, isAka: false }))
const HONOR_TILES = Array.from({ length: 7 }, (_, i) => ({ suit: 'z', value: i + 1, isAka: false }))
const PICKER_ROWS = [MAN_TILES, PIN_TILES, SOU_TILES, HONOR_TILES]

// ── Wait type label ───────────────────────────────────────────────────────────

const WAIT_TYPE_LABEL = {
  ryanmen: 'Ryanmen (two-sided)',
  kanchan: 'Kanchan (middle)',
  penchan: 'Penchan (edge)',
  shanpon: 'Shanpon (dual pair)',
  tanki:   'Tanki (pair wait)',
  chiitoi: 'Chiitoitsu (seven pairs)',
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar({ streak, bestStreak, total, correct }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-400">
      <span className="font-semibold text-slate-300">Practice</span>
      <span className="ml-auto">
        Score: <span className="text-green-400 font-medium">{correct}</span>/{total}
      </span>
      <span>
        Streak: <span className={`font-medium ${streak > 0 ? 'text-amber-400' : 'text-slate-500'}`}>{streak}</span>
      </span>
      {bestStreak > 0 && (
        <span>
          Best: <span className="text-sky-400 font-medium">{bestStreak}</span>
        </span>
      )}
    </div>
  )
}

// ── Guess picker row ──────────────────────────────────────────────────────────

function PickerRow({ tiles, guessSet, waitSet, revealed, onToggle }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tiles.map((tile) => {
        const id = tileToRiichi(tile)
        const isGuessed = guessSet.has(id)
        const isWait = waitSet.has(id)

        let ringClass = ''
        if (!revealed && isGuessed) {
          ringClass = 'ring-2 ring-sky-400'
        } else if (revealed) {
          if (isWait && isGuessed) ringClass = 'ring-2 ring-green-400'
          else if (isWait && !isGuessed) ringClass = 'ring-2 ring-amber-400'
          else if (!isWait && isGuessed) ringClass = 'ring-2 ring-rose-500'
        }

        return (
          <button
            key={id}
            type="button"
            onClick={() => !revealed && onToggle(id)}
            disabled={revealed}
            aria-label={`${tileLabel(tile)}${isGuessed ? ' (selected)' : ''}`}
            className={[
              'relative flex items-center justify-center rounded border select-none transition-all',
              'w-8 h-10 text-xl leading-none',
              tile.suit === 'm' ? 'bg-rose-900/50 border-rose-700 text-rose-200' : '',
              tile.suit === 'p' ? 'bg-sky-900/50 border-sky-700 text-sky-200' : '',
              tile.suit === 's' ? 'bg-emerald-900/50 border-emerald-700 text-emerald-200' : '',
              tile.suit === 'z' ? 'bg-violet-900/50 border-violet-700 text-violet-200' : '',
              revealed ? 'cursor-default opacity-80' : 'cursor-pointer hover:brightness-125 active:scale-90',
              ringClass,
            ].join(' ')}
          >
            {tileToUnicode(tile)}
          </button>
        )
      })}
    </div>
  )
}

// ── Feedback summary ──────────────────────────────────────────────────────────

function Feedback({ waits, guessSet }) {
  const waitSet = new Set(waits)
  const correct = waits.filter(w => guessSet.has(w))
  const missed  = waits.filter(w => !guessSet.has(w))
  const extra   = [...guessSet].filter(w => !waitSet.has(w))

  const isPerfect = correct.length === waits.length && extra.length === 0

  if (isPerfect) {
    return (
      <div className="rounded-lg border border-green-700 bg-green-900/20 px-3 py-2 text-sm text-green-300 font-semibold">
        Perfect! All waits identified correctly.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 flex flex-col gap-1.5 text-xs">
      {correct.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-green-400 font-medium">Correct:</span>
          {correct.map(w => (
            <span key={w} className="text-green-300 text-base leading-none">{tileToUnicode(riichiIntToTile(w))}</span>
          ))}
        </div>
      )}
      {missed.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-amber-400 font-medium">Missed:</span>
          {missed.map(w => (
            <span key={w} className="text-amber-300 text-base leading-none">{tileToUnicode(riichiIntToTile(w))}</span>
          ))}
        </div>
      )}
      {extra.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-rose-400 font-medium">Wrong guesses:</span>
          {extra.map(w => (
            <span key={w} className="text-rose-300 text-base leading-none">{tileToUnicode(riichiIntToTile(w))}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PracticeSession() {
  const [hand, setHand] = useState(() => generatePracticeHand())
  const [guesses, setGuesses] = useState(new Set())
  const [revealed, setRevealed] = useState(false)
  const [sorted, setSorted] = useState(false)
  const [stats, setStats] = useState({ streak: 0, bestStreak: 0, total: 0, correct: 0 })

  const waitSet = useMemo(() => new Set(hand.waits), [hand.waits])

  const displayTiles = useMemo(() => {
    if (!sorted) return hand.tiles
    return [...hand.tiles].sort((a, b) => {
      const suitOrder = { m: 0, p: 1, s: 2, z: 3 }
      const sd = suitOrder[a.suit] - suitOrder[b.suit]
      return sd !== 0 ? sd : a.value - b.value
    })
  }, [hand.tiles, sorted])

  function toggleGuess(id) {
    setGuesses(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleReveal() {
    const isPerfect = waitSet.size === guesses.size && [...waitSet].every(w => guesses.has(w))
    setRevealed(true)
    setStats(s => ({
      total: s.total + 1,
      correct: s.correct + (isPerfect ? 1 : 0),
      streak: isPerfect ? s.streak + 1 : 0,
      bestStreak: Math.max(s.bestStreak, isPerfect ? s.streak + 1 : s.streak),
    }))
  }

  function handleNext() {
    setHand(generatePracticeHand())
    setGuesses(new Set())
    setRevealed(false)
    setSorted(false)
  }

  return (
    <div className="flex flex-col gap-4 p-3 max-w-lg mx-auto">

      <StatsBar
        streak={stats.streak}
        bestStreak={stats.bestStreak}
        total={stats.total}
        correct={stats.correct}
      />

      {/* Hand display */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-300">Find the tenpai wait(s)</span>
          <button
            onClick={() => setSorted(s => !s)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors border border-slate-700 rounded px-2 py-0.5"
          >
            {sorted ? 'Unsort' : 'Sort'}
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {displayTiles.map((tile, i) => (
            <TileDisplay key={i} tile={tile} size="md" />
          ))}
        </div>
      </div>

      {/* Guess picker */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 flex flex-col gap-2">
        <span className="text-sm text-slate-400">
          {revealed ? 'Answer:' : 'Tap your wait guesses:'}
        </span>
        {PICKER_ROWS.map((row, ri) => (
          <PickerRow
            key={ri}
            tiles={row}
            guessSet={guesses}
            waitSet={waitSet}
            revealed={revealed}
            onToggle={toggleGuess}
          />
        ))}

        {/* Legend after reveal */}
        {revealed && (
          <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 mt-1">
            <span><span className="inline-block w-2 h-2 rounded-sm bg-green-400 mr-1" />correct</span>
            <span><span className="inline-block w-2 h-2 rounded-sm bg-amber-400 mr-1" />missed</span>
            <span><span className="inline-block w-2 h-2 rounded-sm bg-rose-500 mr-1" />wrong guess</span>
          </div>
        )}
      </div>

      {/* Feedback */}
      {revealed && (
        <Feedback waits={hand.waits} guessSet={guesses} />
      )}

      {/* Wait type label after reveal */}
      {revealed && (
        <div className="rounded border border-slate-700 bg-slate-800/40 px-3 py-2 text-xs text-slate-400">
          Wait type: <span className="text-slate-200 font-medium">{WAIT_TYPE_LABEL[hand.waitType] ?? hand.waitType}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {!revealed ? (
          <button
            onClick={handleReveal}
            disabled={guesses.size === 0}
            className="flex-1 py-2.5 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Reveal
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 py-2.5 rounded-lg bg-sky-700 text-white text-sm font-semibold hover:bg-sky-600 transition-colors"
          >
            Next Hand
          </button>
        )}
        <button
          onClick={handleNext}
          className="px-3 py-2.5 rounded-lg border border-slate-700 text-slate-400 text-sm hover:border-slate-500 hover:text-slate-200 transition-colors"
          title="Skip this hand"
        >
          Skip
        </button>
      </div>

    </div>
  )
}
