import { useState } from 'react'
import useGameStore from '../../stores/gameStore'
import { getRulesValidationErrors, sanitizeRules, presetRules } from '../../lib/rules.js'

export default function GameSetup({ onStart }) {
  const startGame = useGameStore((s) => s.startGame)
  const [numPlayers, setNumPlayers] = useState(4)
  const [names, setNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4'])
  const [gameType, setGameType] = useState('hanchan')
  const [entryMode, setEntryMode] = useState('detailed')
  const [drawRule, setDrawRule] = useState('fixed-pool')
  const [rules, setRules] = useState(() => presetRules('ema', 4))
  const rulesErrors = getRulesValidationErrors(rules, numPlayers)

  function handleNumPlayers(n) {
    setRules((prev) => ({
      ...presetRules(prev.preset, n),
      ...prev,
      ...sanitizeRules(prev, n),
    }))
    setNumPlayers(n)
  }

  function handleStart() {
    if (rulesErrors.length > 0) return
    startGame(names.slice(0, numPlayers), gameType, entryMode, drawRule, numPlayers, sanitizeRules(rules, numPlayers))
    onStart()
  }

  function updateRule(key, value) {
    setRules((prev) => ({ ...prev, [key]: value }))
  }

  function updateUmaAt(index, value) {
    setRules((prev) => {
      const nextUma = [...(prev.uma ?? [])]
      nextUma[index] = value
      return { ...prev, uma: nextUma }
    })
  }

  function applyPreset(preset) {
    setRules(presetRules(preset, numPlayers))
  }

  function resetToPreset() {
    applyPreset(rules.preset)
  }

  function updateRedAt(suit, value) {
    setRules((prev) => ({ ...prev, redFives: { ...prev.redFives, [suit]: Number(value) || 0 } }))
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

      {/* Rule toggles */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Rule Toggles</h3>

        <div className="space-y-2">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Preset</div>
          <div className="flex gap-2">
            <button type="button" onClick={() => applyPreset('ema')} className={`flex-1 py-2 rounded border text-sm ${rules.preset === 'ema' ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>EMA</button>
            <button type="button" onClick={() => applyPreset('wrc')} className={`flex-1 py-2 rounded border text-sm ${rules.preset === 'wrc' ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>WRC-like</button>
            <button type="button" onClick={() => applyPreset('mleague')} className={`flex-1 py-2 rounded border text-sm ${rules.preset === 'mleague' ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>M-League-like</button>
            <button type="button" onClick={() => updateRule('preset', 'custom')} className={`flex-1 py-2 rounded border text-sm ${rules.preset === 'custom' ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>Custom</button>
          </div>
          <button type="button" onClick={resetToPreset} className="w-full py-2 rounded border border-slate-600 text-slate-300 text-sm hover:border-slate-400">
            Reset current preset defaults
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="text-slate-300">Start score</label>
          <input type="number" min={10000} step={100} value={rules.startScore} onChange={(e) => updateRule('startScore', Number(e.target.value) || 0)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100" />

          <label className="text-slate-300">Return points</label>
          <input type="number" min={10000} step={100} value={rules.returnPts} onChange={(e) => updateRule('returnPts', Number(e.target.value) || 0)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100" />

          <label className="text-slate-300">Oka (1st place bonus)</label>
          <input type="number" value={rules.oka} onChange={(e) => updateRule('oka', Number(e.target.value) || 0)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100" />

          <label className="text-slate-300">Riichi stick value</label>
          <input type="number" min={100} step={100} value={rules.riichiStickValue} onChange={(e) => updateRule('riichiStickValue', Number(e.target.value) || 0)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100" />

          <label className="text-slate-300">Honba / payer</label>
          <input type="number" min={0} step={100} value={rules.honbaValuePerPayer} onChange={(e) => updateRule('honbaValuePerPayer', Number(e.target.value) || 0)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="text-slate-300">Open tanyao (kuitan)</label>
          <input type="checkbox" checked={rules.openTanyao} onChange={(e) => updateRule('openTanyao', e.target.checked)} />

          <label className="text-slate-300">Enable red dora</label>
          <input type="checkbox" checked={rules.redDoraEnabled} onChange={(e) => updateRule('redDoraEnabled', e.target.checked)} />
        </div>

        {rules.redDoraEnabled && (
          <div className="space-y-1">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Red fives by suit</div>
            <div className="grid grid-cols-3 gap-2">
              {['m', 'p', 's'].map((suit) => (
                <label key={suit} className="flex items-center gap-2 text-slate-300 text-sm">
                  <span>{suit}</span>
                  <input type="number" min={0} max={2} step={1} value={rules.redFives?.[suit] ?? 0} onChange={(e) => updateRedAt(suit, e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100" />
                </label>
              ))}
            </div>
          </div>
        )}

        {rulesErrors.length > 0 && (
          <ul className="text-xs text-rose-400 space-y-1">
            {rulesErrors.map((err) => <li key={err}>• {err}</li>)}
          </ul>
        )}

        <div className="space-y-1">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Uma</div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: numPlayers }, (_, i) => (
              <input
                key={i}
                type="number"
                value={rules.uma?.[i] ?? 0}
                onChange={(e) => updateUmaAt(i, Number(e.target.value) || 0)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm"
              />
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between text-sm text-slate-300">
          <span>Bust ends game immediately</span>
          <input type="checkbox" checked={rules.bustEndsGame} onChange={(e) => updateRule('bustEndsGame', e.target.checked)} />
        </label>

        <label className="flex items-center justify-between text-sm text-slate-300">
          <span>All-tenpai keeps dealer</span>
          <input type="checkbox" checked={rules.allTenpaiDealerStays} onChange={(e) => updateRule('allTenpaiDealerStays', e.target.checked)} />
        </label>
      </div>

      <button
        onClick={handleStart}
        disabled={rulesErrors.length > 0}
        className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-colors"
      >
        Start &amp; Roll for Dealer
      </button>
    </div>
  )
}
