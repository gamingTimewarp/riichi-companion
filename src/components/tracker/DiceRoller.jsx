import { useState } from 'react'
import useGameStore from '../../stores/gameStore'
import WallVisualizer from './WallVisualizer'

const DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

function rollDie() {
  return Math.floor(Math.random() * 6) + 1
}

function DieFace({ value, onClick, rolling }) {
  return (
    <button
      onClick={onClick}
      className={`text-6xl select-none transition-transform ${
        rolling ? 'animate-spin' : 'hover:scale-110 active:scale-95'
      }`}
    >
      {value ? DIE_FACES[value - 1] : '🎲'}
    </button>
  )
}

// Dealer mode: one die per player. Highest roll becomes East.
function DealerDice({ players, onConfirm }) {
  const setDealer = useGameStore((s) => s.setDealer)
  const [rolls, setRolls] = useState(players.map(() => null))
  const [rolling, setRolling] = useState(players.map(() => false))
  const [tieIndices, setTieIndices] = useState(null) // null = no tie phase

  const allRolled = rolls.every((r) => r !== null)

  function rollPlayer(i) {
    setRolling((prev) => { const n = [...prev]; n[i] = true; return n })
    setTimeout(() => {
      const val = rollDie()
      setRolls((prev) => { const n = [...prev]; n[i] = val; return n })
      setRolling((prev) => { const n = [...prev]; n[i] = false; return n })
    }, 400)
  }

  function rollAll() {
    const indicesToRoll = tieIndices ?? players.map((_, i) => i)
    indicesToRoll.forEach((i) => rollPlayer(i))
  }

  function getWinner(currentRolls, candidates) {
    const relevant = candidates.map((i) => ({ i, v: currentRolls[i] }))
    const max = Math.max(...relevant.map((r) => r.v))
    const winners = relevant.filter((r) => r.v === max).map((r) => r.i)
    return winners
  }

  function handleConfirm() {
    if (!allRolled) return
    const candidates = tieIndices ?? players.map((_, i) => i)
    const winners = getWinner(rolls, candidates)
    if (winners.length === 1) {
      setDealer(winners[0])
      onConfirm(winners[0])
    } else {
      // Tie — re-roll only tied players
      setTieIndices(winners)
      const resetRolls = [...rolls]
      winners.forEach((i) => { resetRolls[i] = null })
      setRolls(resetRolls)
    }
  }

  const activeCandidates = tieIndices ?? players.map((_, i) => i)
  const highVal = allRolled ? Math.max(...activeCandidates.map((i) => rolls[i])) : null

  return (
    <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Dealer Selection</h2>
        <p className="text-slate-400 text-sm mt-1">
          {tieIndices
            ? `Tie! ${tieIndices.map((i) => players[i].name).join(' & ')} re-roll.`
            : 'Highest roll becomes East (dealer).'}
        </p>
      </div>

      <div className="space-y-3">
        {players.map((p, i) => {
          const isActive = activeCandidates.includes(i)
          const isWinner = allRolled && rolls[i] === highVal && isActive
          return (
            <div
              key={i}
              className={`flex items-center gap-4 p-3 rounded-xl border ${
                isWinner
                  ? 'border-yellow-400 bg-yellow-900/30'
                  : isActive
                  ? 'border-slate-600 bg-slate-800'
                  : 'border-slate-700 bg-slate-900 opacity-40'
              }`}
            >
              <span className="text-slate-300 text-sm font-medium w-24 truncate">{p.name}</span>
              <div className="flex-1 flex justify-center">
                <DieFace
                  value={rolls[i]}
                  rolling={rolling[i]}
                  onClick={isActive && !rolling[i] ? () => rollPlayer(i) : undefined}
                />
              </div>
              <span className="w-8 text-center text-lg font-bold text-slate-200">
                {rolls[i] ?? ''}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={rollAll}
          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold rounded-xl transition-colors"
        >
          Roll All
        </button>
        <button
          onClick={handleConfirm}
          disabled={!allRolled}
          className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors"
        >
          Confirm Dealer
        </button>
      </div>
    </div>
  )
}

// Wall mode: 2 dice, sum determines wall break. Shows full wall visualizer.
function WallDice({ onDone }) {
  const numPlayers = useGameStore((s) => s.numPlayers)
  const [dice, setDice] = useState([null, null])
  const [rolling, setRolling] = useState(false)

  const sum = dice[0] && dice[1] ? dice[0] + dice[1] : null

  function roll() {
    setRolling(true)
    setTimeout(() => {
      setDice([rollDie(), rollDie()])
      setRolling(false)
    }, 400)
  }

  return (
    <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Wall Break</h2>
        <p className="text-slate-400 text-sm mt-1">
          Roll 2 dice — the sum determines which wall is broken and where.
        </p>
      </div>

      {/* Dice */}
      <div className="flex justify-center gap-8">
        {dice.map((d, i) => (
          <DieFace key={i} value={d} rolling={rolling} onClick={roll} />
        ))}
      </div>

      {/* Dice sum badge */}
      {sum !== null && (
        <div className="bg-slate-800 rounded-xl px-4 py-2 text-center">
          <span className="text-3xl font-bold text-sky-400">{sum}</span>
          {' '}
          <span className="text-slate-400 text-sm">= {dice[0]} + {dice[1]}</span>
        </div>
      )}

      {/* Wall visualization */}
      {sum !== null && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
          <WallVisualizer sum={sum} numPlayers={numPlayers} />
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={roll}
          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold rounded-xl transition-colors"
        >
          Roll
        </button>
        <button
          onClick={onDone}
          className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}

export default function DiceRoller({ mode, players, onConfirmDealer, onDone }) {
  if (mode === 'dealer') {
    return <DealerDice players={players} onConfirm={onConfirmDealer} />
  }
  return <WallDice onDone={onDone} />
}
