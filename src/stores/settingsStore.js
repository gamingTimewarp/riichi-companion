import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { presetRules, sanitizeRules } from '../lib/rules.js'

const useSettingsStore = create(
  persist(
    (set, get) => ({
      rulesByPlayers: {
        3: presetRules('ema', 3),
        4: presetRules('ema', 4),
      },

      setRulesForPlayers: (numPlayers, patch) =>
        set((state) => {
          const n = Number(numPlayers) === 3 ? 3 : 4
          const current = state.rulesByPlayers[n] ?? presetRules('ema', n)
          const merged = sanitizeRules({ ...current, ...patch }, n)
          return { rulesByPlayers: { ...state.rulesByPlayers, [n]: merged } }
        }),

      applyPresetForPlayers: (numPlayers, preset) =>
        set((state) => {
          const n = Number(numPlayers) === 3 ? 3 : 4
          return {
            rulesByPlayers: {
              ...state.rulesByPlayers,
              [n]: sanitizeRules(presetRules(preset, n), n),
            },
          }
        }),

      resetPresetForPlayers: (numPlayers) => {
        const n = Number(numPlayers) === 3 ? 3 : 4
        const current = get().rulesByPlayers[n] ?? presetRules('ema', n)
        const preset = current.preset || 'ema'
        get().applyPresetForPlayers(n, preset)
      },

      getRulesForPlayers: (numPlayers) => {
        const n = Number(numPlayers) === 3 ? 3 : 4
        return sanitizeRules(get().rulesByPlayers[n] ?? presetRules('ema', n), n)
      },
    }),
    {
      name: 'riichi-settings',
      version: 1,
      migrate: (persistedState) => {
        const base = persistedState?.rulesByPlayers ?? {}
        return {
          ...persistedState,
          rulesByPlayers: {
            3: sanitizeRules(base[3] ?? presetRules('ema', 3), 3),
            4: sanitizeRules(base[4] ?? presetRules('ema', 4), 4),
          },
        }
      },
    },
  ),
)

export default useSettingsStore
