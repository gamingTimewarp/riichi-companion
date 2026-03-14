import test from 'node:test'
import assert from 'node:assert/strict'

import useSettingsStore from '../src/stores/settingsStore.js'

function resetSettings() {
  useSettingsStore.setState({
    rulesByPlayers: {
      3: useSettingsStore.getState().getRulesForPlayers(3),
      4: useSettingsStore.getState().getRulesForPlayers(4),
    },
    presetLockByPlayers: { 3: false, 4: false },
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


test('resetAllSettings resets both player profiles to EMA defaults', () => {
  resetSettings()
  useSettingsStore.getState().setRulesForPlayers(4, { preset: 'custom', riichiStickValue: 2000 })
  useSettingsStore.getState().setRulesForPlayers(3, { preset: 'custom', riichiStickValue: 700 })

  useSettingsStore.getState().resetAllSettings()

  const rules4 = useSettingsStore.getState().getRulesForPlayers(4)
  const rules3 = useSettingsStore.getState().getRulesForPlayers(3)

  assert.equal(rules4.preset, 'ema')
  assert.equal(rules4.riichiStickValue, 1000)
  assert.equal(rules3.preset, 'ema')
  assert.equal(rules3.riichiStickValue, 1000)
})




test('preset lock blocks manual rule edits until unlocked', () => {
  resetSettings()
  useSettingsStore.getState().setPresetLockForPlayers(4, true)
  useSettingsStore.getState().setRulesForPlayers(4, { riichiStickValue: 1500 })

  assert.equal(useSettingsStore.getState().getRulesForPlayers(4).riichiStickValue, 1000)

  useSettingsStore.getState().setPresetLockForPlayers(4, false)
  useSettingsStore.getState().setRulesForPlayers(4, { riichiStickValue: 1500 })
  assert.equal(useSettingsStore.getState().getRulesForPlayers(4).riichiStickValue, 1500)
})
test('export/import settings profile round-trip', () => {
  resetSettings()
  useSettingsStore.getState().setRulesForPlayers(4, { preset: 'custom', riichiStickValue: 1800 })
  useSettingsStore.getState().setPresetLockForPlayers(4, true)
  const exported = useSettingsStore.getState().exportSettingsProfile()

  useSettingsStore.getState().resetAllSettings()
  assert.equal(useSettingsStore.getState().getRulesForPlayers(4).riichiStickValue, 1000)

  useSettingsStore.getState().importSettingsProfile(exported)
  assert.equal(useSettingsStore.getState().getRulesForPlayers(4).riichiStickValue, 1800)
  assert.equal(useSettingsStore.getState().presetLockByPlayers[4], true)
})
