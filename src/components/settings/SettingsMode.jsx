import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useSettingsStore from '../../stores/settingsStore'
import { getRulesValidationErrors } from '../../lib/rules.js'
import { importJSON } from '../../lib/storage.js'
import InfoTooltip from '../InfoTooltip.jsx'

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function SettingsMode() {
  const [numPlayers, setNumPlayers] = useState(4)
  const [status, setStatus] = useState('')
  const importRef = useRef(null)

  const rules = useSettingsStore((s) => s.rulesByPlayers[numPlayers])
  const setRulesForPlayers = useSettingsStore((s) => s.setRulesForPlayers)
  const applyPresetForPlayers = useSettingsStore((s) => s.applyPresetForPlayers)
  const resetPresetForPlayers = useSettingsStore((s) => s.resetPresetForPlayers)
  const resetAllSettings = useSettingsStore((s) => s.resetAllSettings)
  const exportSettingsProfile = useSettingsStore((s) => s.exportSettingsProfile)
  const importSettingsProfile = useSettingsStore((s) => s.importSettingsProfile)
  const presetLocked = useSettingsStore((s) => Boolean(s.presetLockByPlayers[numPlayers]))
  const setPresetLockForPlayers = useSettingsStore((s) => s.setPresetLockForPlayers)

  const rulesErrors = getRulesValidationErrors(rules, numPlayers)

  function updateRule(key, value) {
    if (presetLocked) return
    setRulesForPlayers(numPlayers, { [key]: value })
  }

  function updateUmaAt(index, value) {
    if (presetLocked) return
    const nextUma = [...(rules.uma ?? [])]
    nextUma[index] = value
    setRulesForPlayers(numPlayers, { uma: nextUma })
  }

  function updateRedAt(suit, value) {
    if (presetLocked) return
    setRulesForPlayers(numPlayers, { redFives: { ...rules.redFives, [suit]: Number(value) || 0 } })
  }

  function handleExport() {
    const payload = exportSettingsProfile()
    downloadJSON(payload, `riichi-settings-profile-${new Date().toISOString().slice(0, 10)}.json`)
    setStatus('Settings profile exported.')
  }

  async function handleImport(file) {
    if (!file) return
    try {
      const parsed = await importJSON(file)
      importSettingsProfile(parsed)
      setStatus('Settings profile imported successfully.')
    } catch (err) {
      setStatus(err?.message || 'Failed to import settings profile.')
    }
  }

  return (
    <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-slate-100">Settings</h2>
      <p className="text-sm text-slate-400">Configure default rules presets/toggles used when you start a new game.</p>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Settings Profile</h3>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={handleExport} className="py-2 rounded border border-slate-600 text-slate-200 text-sm hover:border-slate-400">Export profile</button>
          <button type="button" onClick={() => importRef.current?.click()} className="py-2 rounded border border-slate-600 text-slate-200 text-sm hover:border-slate-400">Import profile</button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              handleImport(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
        {status && <div className="text-xs text-slate-400">{status}</div>}
      </div>


      <div className="rounded border border-slate-700 bg-slate-900/40 p-3 text-xs text-slate-300">
        <div className="font-semibold text-slate-200 mb-1">Privacy</div>
        <p className="mb-2">Review data handling details before sharing debug bundles.</p>
        <Link to="/privacy" className="text-sky-400 hover:text-sky-300 underline">Open privacy policy</Link>
      </div>

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


      <label className="flex items-center justify-between text-sm text-slate-300">
        <span className="flex items-center">
          Lock preset edits for {numPlayers}p
          <InfoTooltip text="Prevents accidental rule changes when using a named preset. Toggle off to edit rules manually." />
        </span>
        <input
          type="checkbox"
          checked={presetLocked}
          onChange={(e) => setPresetLockForPlayers(numPlayers, e.target.checked)}
        />
      </label>
      {presetLocked && <p className="text-xs text-amber-300">Preset is locked. Unlock to edit rules manually.</p>}

      <div className="space-y-2">
        <div className="text-xs text-slate-400 uppercase tracking-wide">Preset</div>
        <div className="flex gap-2">
          <button type="button" onClick={() => applyPresetForPlayers(numPlayers, 'ema')} className={`flex-1 py-2 rounded border text-sm ${rules.preset === 'ema' ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>EMA</button>
          <button type="button" onClick={() => applyPresetForPlayers(numPlayers, 'wrc')} className={`flex-1 py-2 rounded border text-sm ${rules.preset === 'wrc' ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>WRC-like</button>
          <button type="button" onClick={() => applyPresetForPlayers(numPlayers, 'mleague')} className={`flex-1 py-2 rounded border text-sm ${rules.preset === 'mleague' ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>M-League-like</button>
          <button type="button" disabled={presetLocked} onClick={() => updateRule('preset', 'custom')} className={`flex-1 py-2 rounded border text-sm ${rules.preset === 'custom' ? 'bg-sky-700 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>Custom</button>
        </div>
        <button type="button" onClick={() => resetPresetForPlayers(numPlayers)} className="w-full py-2 rounded border border-slate-600 text-slate-300 text-sm hover:border-slate-400">
          Reset current preset defaults
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset all settings for both 3-player and 4-player profiles?')) {
              resetAllSettings()
            }
          }}
          className="w-full py-2 rounded border border-rose-700 text-rose-300 text-sm hover:border-rose-500"
        >
          Reset all settings (3p + 4p)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="text-slate-300 flex items-center">
          Start score
          <InfoTooltip text="Points each player starts with. Common values are 25,000 and 30,000." />
        </label>
        <input type="number" min={10000} step={100} value={rules.startScore} onChange={(e) => updateRule('startScore', Number(e.target.value) || 0)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100" />

        <label className="text-slate-300 flex items-center">
          Return points
          <InfoTooltip text="The target score used to calculate end-game point differences. Players above this gain points; players below lose points." />
        </label>
        <input type="number" min={10000} step={100} value={rules.returnPts} onChange={(e) => updateRule('returnPts', Number(e.target.value) || 0)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100" />

        <label className="text-slate-300 flex items-center">
          Oka (1st place bonus)
          <InfoTooltip text="Bonus points awarded to 1st place, funded by the other players. Derived from the gap between start score and return points." />
        </label>
        <input type="number" value={rules.oka} onChange={(e) => updateRule('oka', Number(e.target.value) || 0)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100" />
        {(() => {
          const calc = (rules.returnPts - rules.startScore) * numPlayers
          return calc > 0 ? (
            <div className="col-span-2 -mt-1 flex items-center gap-2">
              <span className="text-xs text-slate-500">
                ({rules.returnPts.toLocaleString()} − {rules.startScore.toLocaleString()}) × {numPlayers} = <span className="text-slate-400">{calc.toLocaleString()}</span>
              </span>
              <button
                type="button"
                onClick={() => updateRule('oka', calc)}
                className="text-xs px-2 py-0.5 rounded border border-slate-600 text-slate-400 hover:border-sky-500 hover:text-sky-300 transition-colors"
              >
                Use
              </button>
            </div>
          ) : null
        })()}

        <label className="text-slate-300 flex items-center">
          Riichi stick value
          <InfoTooltip text="Points paid when declaring riichi. Sticks left on the table are collected by the next hand winner. Standard is 1,000." />
        </label>
        <input type="number" min={100} step={100} value={rules.riichiStickValue} onChange={(e) => updateRule('riichiStickValue', Number(e.target.value) || 0)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100" />

        <label className="text-slate-300 flex items-center">
          Honba / payer
          <InfoTooltip text="Extra points added per honba counter, paid per paying player. Standard is 100 per payer — so 300 extra total in a 4-player ron." />
        </label>
        <input type="number" min={0} step={100} value={rules.honbaValuePerPayer} onChange={(e) => updateRule('honbaValuePerPayer', Number(e.target.value) || 0)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="text-slate-300 flex items-center">
          Open tanyao (kuitan)
          <InfoTooltip text="Allows the tanyao (all-simples) yaku with an open (called) hand. Disabled in some traditional rulesets." />
        </label>
        <input type="checkbox" checked={rules.openTanyao} onChange={(e) => updateRule('openTanyao', e.target.checked)} />

        <label className="text-slate-300 flex items-center">
          Enable red dora
          <InfoTooltip text="Adds special red five tiles to the deck. Each red five counts as one bonus dora." />
        </label>
        <input type="checkbox" checked={rules.redDoraEnabled} onChange={(e) => updateRule('redDoraEnabled', e.target.checked)} />
      </div>

      {rules.redDoraEnabled && (
        <div className="space-y-1">
          <div className="text-sm text-slate-300 flex items-center">
            Red fives by suit
            <InfoTooltip text="Number of red fives per suit. m = man (characters), p = pin (circles), s = sou (bamboo)." />
          </div>
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
        <div className="text-sm text-slate-300 flex items-center">
          Uma
          <InfoTooltip text="End-game bonuses and penalties by finishing position, entered from 1st to last place. E.g. +20, +10, −10, −20." />
        </div>
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
        <span className="flex items-center">
          Kiriage mangan
          <InfoTooltip text="Rounds up hands at 3 han 60 fu or 4 han 30 fu to a full mangan payout." />
        </span>
        <input type="checkbox" checked={rules.kiriageMangan} onChange={(e) => updateRule('kiriageMangan', e.target.checked)} />
      </label>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="text-slate-300 flex items-center">
          Kazoe yakuman policy
          <InfoTooltip text="How to score hands with 13+ han. Enabled: full yakuman. Capped: capped at sanbaiman. Disabled: always scored as sanbaiman." />
        </label>
        <select value={rules.kazoeYakumanPolicy} onChange={(e) => updateRule('kazoeYakumanPolicy', e.target.value)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100">
          <option value="enabled">Enabled</option>
          <option value="capped">Capped (Sanbaiman)</option>
          <option value="disabled">Disabled</option>
        </select>

        <label className="text-slate-300 flex items-center">
          Multiple ron
          <InfoTooltip text="What happens when two players win off the same discard. Head-bump (atamahane) gives the win only to the player sitting closest after the discarder." />
        </label>
        <select value={rules.multipleRon} onChange={(e) => updateRule('multipleRon', e.target.value)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100">
          <option value="allow">Allow</option>
          <option value="head-bump">Head-bump (Atamahane)</option>
        </select>
      </div>

      <label className="flex items-center justify-between text-sm text-slate-300">
        <span className="flex items-center">
          Bust ends game immediately
          <InfoTooltip text="Ends the game as soon as any player's score drops to 0 or below, even mid-round." />
        </span>
        <input type="checkbox" checked={rules.bustEndsGame} onChange={(e) => updateRule('bustEndsGame', e.target.checked)} />
      </label>

      <label className="flex items-center justify-between text-sm text-slate-300">
        <span className="flex items-center">
          All-tenpai keeps dealer
          <InfoTooltip text="On a drawn round (ryuukyoku), if all players are in tenpai the dealer retains their seat instead of passing." />
        </span>
        <input type="checkbox" checked={rules.allTenpaiDealerStays} onChange={(e) => updateRule('allTenpaiDealerStays', e.target.checked)} />
      </label>

      <label className="flex items-center justify-between text-sm text-slate-300">
        <span className="flex items-center">
          Agari-yame enabled
          <InfoTooltip text="In the final round, the dealer may choose to end the game by winning rather than continuing play." />
        </span>
        <input type="checkbox" checked={rules.agariYame} onChange={(e) => updateRule('agariYame', e.target.checked)} />
      </label>

      <label className="flex items-center justify-between text-sm text-slate-300">
        <span className="flex items-center">
          Allow West-round extension
          <InfoTooltip up text="If no player has passed the return-point threshold at the end of South round, play continues into West round." />
        </span>
        <input type="checkbox" checked={rules.allowWestRoundExtension} onChange={(e) => updateRule('allowWestRoundExtension', e.target.checked)} />
      </label>
    </div>
  )
}
