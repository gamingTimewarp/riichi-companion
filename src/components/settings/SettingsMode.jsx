import { useState } from 'react'
import useSettingsStore from '../../stores/settingsStore'
import { getRulesValidationErrors } from '../../lib/rules.js'

export default function SettingsMode() {
  const [numPlayers, setNumPlayers] = useState(4)
  const rules = useSettingsStore((s) => s.rulesByPlayers[numPlayers])
  const setRulesForPlayers = useSettingsStore((s) => s.setRulesForPlayers)
  const applyPresetForPlayers = useSettingsStore((s) => s.applyPresetForPlayers)
  const resetPresetForPlayers = useSettingsStore((s) => s.resetPresetForPlayers)

  const rulesErrors = getRulesValidationErrors(rules, numPlayers)

  function updateRule(key, value) {
    setRulesForPlayers(numPlayers, { [key]: value })
  }

  function updateUmaAt(index, value) {
    const nextUma = [...(rules.uma ?? [])]
    nextUma[index] = value
    setRulesForPlayers(numPlayers, { uma: nextUma })
  }

  function updateRedAt(suit, value) {
    setRulesForPlayers(numPlayers, { redFives: { ...rules.redFives, [suit]: Number(value) || 0 } })
  }

  return (
    <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-slate-100">Settings</h2>
      <p className="text-sm text-slate-400">Configure default rules presets/toggles used when you start a new game.</p>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Player Count Profile</h3>
        <div className="flex gap-2">
          {[4, 3].map((value) => (
            <button
              key={value}
              onClick={() => setNumPlayers(value)}
              className={`flex-1 py-2 rounded border text-sm ${numPlayers === value ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}
            >
              {value} Players
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-slate-400 uppercase tracking-wide">Preset</div>
        <div className="flex gap-2">
          <button type="button" onClick={() => applyPresetForPlayers(numPlayers, 'ema')} className={`flex-1 py-2 rounded border text-sm ${rules.preset === 'ema' ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>EMA</button>
          <button type="button" onClick={() => applyPresetForPlayers(numPlayers, 'wrc')} className={`flex-1 py-2 rounded border text-sm ${rules.preset === 'wrc' ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>WRC-like</button>
          <button type="button" onClick={() => applyPresetForPlayers(numPlayers, 'mleague')} className={`flex-1 py-2 rounded border text-sm ${rules.preset === 'mleague' ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>M-League-like</button>
          <button type="button" onClick={() => updateRule('preset', 'custom')} className={`flex-1 py-2 rounded border text-sm ${rules.preset === 'custom' ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>Custom</button>
        </div>
        <button type="button" onClick={() => resetPresetForPlayers(numPlayers)} className="w-full py-2 rounded border border-slate-600 text-slate-300 text-sm hover:border-slate-400">
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
        <span>Kiriage mangan</span>
        <input type="checkbox" checked={rules.kiriageMangan} onChange={(e) => updateRule('kiriageMangan', e.target.checked)} />
      </label>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="text-slate-300">Kazoe yakuman policy</label>
        <select value={rules.kazoeYakumanPolicy} onChange={(e) => updateRule('kazoeYakumanPolicy', e.target.value)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100">
          <option value="enabled">Enabled</option>
          <option value="capped">Capped (Sanbaiman)</option>
          <option value="disabled">Disabled</option>
        </select>

        <label className="text-slate-300">Multiple ron</label>
        <select value={rules.multipleRon} onChange={(e) => updateRule('multipleRon', e.target.value)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100">
          <option value="allow">Allow</option>
          <option value="head-bump">Head-bump (Atamahane)</option>
        </select>
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
  )
}
