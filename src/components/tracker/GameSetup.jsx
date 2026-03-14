import { useEffect, useMemo, useRef, useState } from 'react'
import useGameStore from '../../stores/gameStore'
import useSettingsStore from '../../stores/settingsStore'
import { presetRules, sanitizeRules } from '../../lib/rules.js'

export default function GameSetup({ onStart }) {
  const startGame = useGameStore((s) => s.startGame)
  const getRulesForPlayers = useSettingsStore((s) => s.getRulesForPlayers)

  const [numPlayers, setNumPlayers] = useState(4)
  const [names, setNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4'])
  const [gameType, setGameType] = useState('hanchan')
  const [entryMode, setEntryMode] = useState('detailed')
  const [drawRule, setDrawRule] = useState('fixed-pool')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [rulesOverrides, setRulesOverrides] = useState({})
  const openedViaHistoryRef = useRef(false)

  const profileRules = getRulesForPlayers(numPlayers)
  const effectiveRules = useMemo(
    () => sanitizeRules({ ...profileRules, ...rulesOverrides }, numPlayers),
    [profileRules, rulesOverrides, numPlayers],
  )



  useEffect(() => {
    if (!advancedOpen || typeof window === 'undefined') return

    const markerState = { ...(window.history.state ?? {}), trackerAdvancedOverridesOpen: true }
    window.history.pushState(markerState, '')
    openedViaHistoryRef.current = true

    const onPopState = () => {
      setAdvancedOpen(false)
      setRulesOverrides({})
      openedViaHistoryRef.current = false
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [advancedOpen])

  function closeAdvancedUI() {
    setAdvancedOpen(false)
    setRulesOverrides({})
    if (typeof window !== 'undefined' && openedViaHistoryRef.current) {
      openedViaHistoryRef.current = false
      window.history.back()
    }
  }

  function setRuleOverride(key, value) {
    setRulesOverrides((prev) => ({ ...prev, [key]: value, preset: 'custom' }))
  }

  function handleStart() {
    startGame(names.slice(0, numPlayers), gameType, entryMode, drawRule, numPlayers, effectiveRules)
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

      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-xs text-slate-300">
        Profile defaults come from <strong>Settings</strong>. You can apply temporary advanced overrides below.
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Player Count</h3>
        <div className="flex gap-2">
          {[
            { value: 4, label: '4 Players', sub: 'Yonma' },
            { value: 3, label: '3 Players', sub: 'Sanma' },
          ].map(({ value, label, sub }) => (
            <button
              key={value}
              onClick={() => { setNumPlayers(value); setRulesOverrides({}) }}
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

      <div className="space-y-2 rounded-lg border border-slate-700 bg-slate-900/40 p-3">
        <button
          type="button"
          onClick={() => (advancedOpen ? closeAdvancedUI() : setAdvancedOpen(true))}
          className="w-full text-left text-sm font-semibold text-slate-200"
        >
          {advancedOpen ? 'Hide' : 'Show'} advanced rule overrides
        </button>
        <p className="text-xs text-slate-400">Overrides apply to this game only and do not change Settings defaults.</p>

        {advancedOpen && (
          <div className="space-y-3 pt-2 border-t border-slate-700">
            <div className="space-y-1">
              <div className="text-xs text-slate-400 uppercase tracking-wide">Quick preset</div>
              <div className="flex gap-2">
                {['ema', 'wrc', 'mleague'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRulesOverrides(presetRules(preset, numPlayers))}
                    className={`flex-1 py-2 rounded border text-xs ${effectiveRules.preset === preset ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between text-sm text-slate-300">
              <span>Open tanyao</span>
              <input type="checkbox" checked={effectiveRules.openTanyao} onChange={(e) => setRuleOverride('openTanyao', e.target.checked)} />
            </label>
            <label className="flex items-center justify-between text-sm text-slate-300">
              <span>Enable red dora</span>
              <input type="checkbox" checked={effectiveRules.redDoraEnabled} onChange={(e) => setRuleOverride('redDoraEnabled', e.target.checked)} />
            </label>
            <label className="flex items-center justify-between text-sm text-slate-300">
              <span>Bust ends game immediately</span>
              <input type="checkbox" checked={effectiveRules.bustEndsGame} onChange={(e) => setRuleOverride('bustEndsGame', e.target.checked)} />
            </label>
            <label className="flex items-center justify-between text-sm text-slate-300">
              <span>All-tenpai keeps dealer</span>
              <input type="checkbox" checked={effectiveRules.allTenpaiDealerStays} onChange={(e) => setRuleOverride('allTenpaiDealerStays', e.target.checked)} />
            </label>
            <label className="flex items-center justify-between text-sm text-slate-300">
              <span>Kiriage mangan</span>
              <input type="checkbox" checked={effectiveRules.kiriageMangan} onChange={(e) => setRuleOverride('kiriageMangan', e.target.checked)} />
            </label>
            <div className="grid grid-cols-2 gap-2 text-sm items-center">
              <label className="text-slate-300">Kazoe policy</label>
              <select value={effectiveRules.kazoeYakumanPolicy} onChange={(e) => setRuleOverride('kazoeYakumanPolicy', e.target.value)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100">
                <option value="enabled">Enabled</option>
                <option value="capped">Capped</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            <button type="button" onClick={() => setRulesOverrides({})} className="w-full py-2 rounded border border-slate-600 text-slate-300 text-sm hover:border-slate-400">
              Reset advanced overrides
            </button>
          </div>
        )}
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
