import { presetRules, sanitizeRules } from './rules.js'

export const SETTINGS_PROFILE_SCHEMA = 'riichi-settings-profile'
export const SETTINGS_PROFILE_VERSION = 1

function sanitizePresetLocks(presetLockByPlayers = {}) {
  return {
    3: Boolean(presetLockByPlayers[3]),
    4: Boolean(presetLockByPlayers[4]),
  }
}

export function buildSettingsProfileExport(rulesByPlayers = {}, presetLockByPlayers = {}) {
  return {
    schema: SETTINGS_PROFILE_SCHEMA,
    version: SETTINGS_PROFILE_VERSION,
    exportedAt: new Date().toISOString(),
    rulesByPlayers: {
      3: sanitizeRules(rulesByPlayers[3] ?? presetRules('ema', 3), 3),
      4: sanitizeRules(rulesByPlayers[4] ?? presetRules('ema', 4), 4),
    },
    presetLockByPlayers: sanitizePresetLocks(presetLockByPlayers),
  }
}

export function parseSettingsProfileImport(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid profile file: expected JSON object.')
  }
  if (payload.schema !== SETTINGS_PROFILE_SCHEMA) {
    throw new Error(`Invalid profile schema. Expected '${SETTINGS_PROFILE_SCHEMA}'.`)
  }
  if (payload.version !== SETTINGS_PROFILE_VERSION) {
    throw new Error(`Unsupported profile version '${payload.version}'.`)
  }
  const base = payload.rulesByPlayers ?? {}
  return {
    rulesByPlayers: {
      3: sanitizeRules(base[3] ?? presetRules('ema', 3), 3),
      4: sanitizeRules(base[4] ?? presetRules('ema', 4), 4),
    },
    presetLockByPlayers: sanitizePresetLocks(payload.presetLockByPlayers),
  }
}
