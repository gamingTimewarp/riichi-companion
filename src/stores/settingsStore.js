import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { presetRules, sanitizeRules } from '../lib/rules.js'
import { buildSettingsProfileExport, parseSettingsProfileImport } from '../lib/settingsProfiles.js'

const defaultPresetLockByPlayers = {
  3: false,
  4: false,
}

const normalizePlayers = (numPlayers) => (Number(numPlayers) === 3 ? 3 : 4)

const useSettingsStore = create(
  persist(
    (set, get) => ({
      rulesByPlayers: {
        3: presetRules('ema', 3),
        4: presetRules('ema', 4),
      },
      presetLockByPlayers: defaultPresetLockByPlayers,

      setRulesForPlayers: (numPlayers, patch) =>
        set((state) => {
          const n = normalizePlayers(numPlayers)
          if (state.presetLockByPlayers[n]) return state
          const current = state.rulesByPlayers[n] ?? presetRules('ema', n)
          const merged = sanitizeRules({ ...current, ...patch }, n)
          return { rulesByPlayers: { ...state.rulesByPlayers, [n]: merged } }
        }),

      applyPresetForPlayers: (numPlayers, preset) =>
        set((state) => {
          const n = normalizePlayers(numPlayers)
          return {
            rulesByPlayers: {
              ...state.rulesByPlayers,
              [n]: sanitizeRules(presetRules(preset, n), n),
            },
          }
        }),

      resetPresetForPlayers: (numPlayers) => {
        const n = normalizePlayers(numPlayers)
        const current = get().rulesByPlayers[n] ?? presetRules('ema', n)
        const preset = current.preset || 'ema'
        get().applyPresetForPlayers(n, preset)
      },

      setPresetLockForPlayers: (numPlayers, locked) =>
        set((state) => {
          const n = normalizePlayers(numPlayers)
          return {
            presetLockByPlayers: {
              ...state.presetLockByPlayers,
              [n]: Boolean(locked),
            },
          }
        }),

      getRulesForPlayers: (numPlayers) => {
        const n = normalizePlayers(numPlayers)
        return sanitizeRules(get().rulesByPlayers[n] ?? presetRules('ema', n), n)
      },

      resetAllSettings: () =>
        set({
          rulesByPlayers: {
            3: sanitizeRules(presetRules('ema', 3), 3),
            4: sanitizeRules(presetRules('ema', 4), 4),
          },
          presetLockByPlayers: defaultPresetLockByPlayers,
        }),

      exportSettingsProfile: () => {
        const state = get()
        return buildSettingsProfileExport(state.rulesByPlayers, state.presetLockByPlayers)
      },

      importSettingsProfile: (payload) => {
        const imported = parseSettingsProfileImport(payload)
        set({
          rulesByPlayers: imported.rulesByPlayers,
          presetLockByPlayers: imported.presetLockByPlayers,
        })
        return imported
      },
    }),
    {
      name: 'riichi-settings',
      version: 2,
      migrate: (persistedState) => {
        const base = persistedState?.rulesByPlayers ?? {}
        const presetLockByPlayers = persistedState?.presetLockByPlayers ?? defaultPresetLockByPlayers
        return {
          ...persistedState,
          rulesByPlayers: {
            3: sanitizeRules(base[3] ?? presetRules('ema', 3), 3),
            4: sanitizeRules(base[4] ?? presetRules('ema', 4), 4),
          },
          presetLockByPlayers: {
            3: Boolean(presetLockByPlayers[3]),
            4: Boolean(presetLockByPlayers[4]),
          },
        }
      },
    },
  ),
)

export default useSettingsStore
