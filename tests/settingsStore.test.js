import test from 'node:test'
import assert from 'node:assert/strict'

import useSettingsStore from '../src/stores/settingsStore.js'

function resetSettings() {
  useSettingsStore.setState({
    rulesByPlayers: {
      3: useSettingsStore.getState().getRulesForPlayers(3),
      4: useSettingsStore.getState().getRulesForPlayers(4),
    },
  })
}

test('settings store keeps independent profiles by player count', () => {
  resetSettings()
  useSettingsStore.getState().setRulesForPlayers(4, { riichiStickValue: 1500 })
  useSettingsStore.getState().setRulesForPlayers(3, { riichiStickValue: 900 })

  assert.equal(useSettingsStore.getState().getRulesForPlayers(4).riichiStickValue, 1500)
  assert.equal(useSettingsStore.getState().getRulesForPlayers(3).riichiStickValue, 900)
})

test('applyPresetForPlayers updates selected player profile only', () => {
  resetSettings()
  useSettingsStore.getState().applyPresetForPlayers(4, 'wrc')

  assert.equal(useSettingsStore.getState().getRulesForPlayers(4).preset, 'wrc')
  assert.equal(useSettingsStore.getState().getRulesForPlayers(4).openTanyao, false)
  assert.equal(useSettingsStore.getState().getRulesForPlayers(3).preset, 'ema')
})
