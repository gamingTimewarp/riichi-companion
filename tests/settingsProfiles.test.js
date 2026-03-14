import test from 'node:test'
import assert from 'node:assert/strict'

import { buildSettingsProfileExport, parseSettingsProfileImport, SETTINGS_PROFILE_SCHEMA } from '../src/lib/settingsProfiles.js'

test('buildSettingsProfileExport creates schema-versioned payload', () => {
  const payload = buildSettingsProfileExport({
    4: { preset: 'custom', riichiStickValue: 1500 },
    3: { preset: 'custom', riichiStickValue: 700 },
  })

  assert.equal(payload.schema, SETTINGS_PROFILE_SCHEMA)
  assert.equal(payload.version, 1)
  assert.equal(payload.rulesByPlayers[4].riichiStickValue, 1500)
  assert.equal(payload.rulesByPlayers[3].riichiStickValue, 700)
  assert.equal(payload.presetLockByPlayers[4], false)
})

test('parseSettingsProfileImport validates schema and sanitizes rules', () => {
  const parsed = parseSettingsProfileImport({
    schema: SETTINGS_PROFILE_SCHEMA,
    version: 1,
    rulesByPlayers: {
      4: { redFives: { m: 9, p: -3, s: 0 }, riichiStickValue: 2000 },
    },
    presetLockByPlayers: { 4: true },
  })

  assert.deepEqual(parsed.rulesByPlayers[4].redFives, { m: 2, p: 0, s: 0 })
  assert.equal(parsed.rulesByPlayers[4].riichiStickValue, 2000)
  assert.equal(parsed.rulesByPlayers[3].preset, 'ema')
  assert.equal(parsed.presetLockByPlayers[4], true)
})

test('parseSettingsProfileImport rejects invalid schema', () => {
  assert.throws(() => parseSettingsProfileImport({ schema: 'wrong', version: 1 }), /Invalid profile schema/)
})
