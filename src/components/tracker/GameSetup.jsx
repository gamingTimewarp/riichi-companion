import { useState } from 'react'
import useGameStore from '../../stores/gameStore'

export default function GameSetup({ onStart }) {
  const startGame = useGameStore((s) => s.startGame)
  const [numPlayers, setNumPlayers] = useState(4)
  const [names, setNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4'])
  const [gameType, setGameType] = useState('hanchan')
  const [entryMode, setEntryMode] = useState('detailed')
  const [drawRule, setDrawRule] = useState('fixed-pool')

  function handleNumPlayers(n) {
    setNumPlayers(n)
  }

  function handleStart() {
    startGame(names.slice(0, numPlayers), gameType, entryMode, drawRule, numPlayers)
    onStart()
  }

  return (
    <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-slate-100">New Game</h2>

      {/* Player count */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Player Count</h3>
        <div className="flex gap-2">
          {[
            { value: 4, label: '4 Players', sub: 'Yonma' },
            { value: 3, label: '3 Players', sub: 'Sanma' },
          ].map(({ value, label, sub }) => (
            <button
              key={value}
              onClick={() => handleNumPlayers(value)}
              className={`flex-1 py-3 px-2 rounded-lg border text-sm font-medium transition-colors ${
                numPlayers === value
                  ? 'bg-sky-700 border-sky-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-slate-300'
              }`}
            >
              <div>{label}</div>
              <div className="text-xs opacity-70">{sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Player names */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Players</h3>
        {names.slice(0, numPlayers).map((name, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-slate-500 text-sm w-6">{i + 1}.</span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                const next = [...names]
                next[i] = e.target.value
                setNames(next)
              }}
              className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-sky-500"
              placeholder={`Player ${i + 1}`}
              maxLength={20}
            />
          </div>
        ))}
      </div>

      {/* Game type */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Game Type</h3>
        <div className="flex gap-2">
          {[
            { value: 'hanchan', label: 'Hanchan', sub: 'East + South' },
            { value: 'tonpuusen', label: 'Tonpuusen', sub: 'East only' },
          ].map(({ value, label, sub }) => (
            <button
              key={value}
              onClick={() => setGameType(value)}
              className={`flex-1 py-3 px-2 rounded-lg border text-sm font-medium transition-colors ${
                gameType === value
                  ? 'bg-sky-700 border-sky-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-slate-300'
              }`}
            >
              <div>{label}</div>
              <div className="text-xs opacity-70">{sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Entry mode */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Score Entry</h3>
        <div className="flex gap-2">
          {[
            { value: 'detailed', label: 'Detailed', sub: 'Han + fu' },
            { value: 'quick', label: 'Quick', sub: 'Point total' },
          ].map(({ value, label, sub }) => (
            <button
              key={value}
              onClick={() => setEntryMode(value)}
              className={`flex-1 py-3 px-2 rounded-lg border text-sm font-medium transition-colors ${
                entryMode === value
                  ? 'bg-violet-700 border-violet-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-slate-300'
              }`}
            >
              <div>{label}</div>
              <div className="text-xs opacity-70">{sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Draw payment rule */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Draw Payments</h3>
        <div className="flex gap-2">
          {[
            { value: 'fixed-pool', label: 'Fixed pool', sub: '3000 split (e.g. 1500 each for 2 tenpai)' },
            { value: 'fixed-noten', label: 'Fixed noten', sub: '1000 per noten player' },
          ].map(({ value, label, sub }) => (
            <button
              key={value}
              onClick={() => setDrawRule(value)}
              className={`flex-1 py-3 px-2 rounded-lg border text-sm font-medium transition-colors ${
                drawRule === value
                  ? 'bg-teal-700 border-teal-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-slate-300'
              }`}
            >
              <div>{label}</div>
              <div className="text-xs opacity-70">{sub}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleStart}
        className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-colors"
      >
        Start &amp; Roll for Dealer
      </button>
    </div>
  )
}
