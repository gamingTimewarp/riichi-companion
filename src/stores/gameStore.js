import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createDefaultRules, sanitizeRules } from '../lib/rules.js'

const defaultPlayers = (names, startingScore = 30000) =>
  (names || ['Player 1', 'Player 2', 'Player 3', 'Player 4']).map((name) => ({
    name,
    score: startingScore,
  }))

const makeSnapshot = (state) => ({
  players: state.players.map((p) => ({ ...p })),
  dealer: state.dealer,
  round: state.round,
  honba: state.honba,
  riichiPool: state.riichiPool,
  rules: { ...state.rules },
})

const migrateState = (persistedState = {}) => {
  const numPlayers = Math.max(3, Math.min(4, Number(persistedState.numPlayers) || persistedState.players?.length || 4))
  const rules = sanitizeRules({
    ...createDefaultRules(numPlayers),
    ...(persistedState.rules ?? {}),
  }, numPlayers)

  const players = (persistedState.players ?? defaultPlayers(undefined, rules.startScore))
    .slice(0, numPlayers)
    .map((player, index) => ({
      name: player?.name || `Player ${index + 1}`,
      score: Number.isFinite(player?.score) ? player.score : rules.startScore,
    }))

  const log = Array.isArray(persistedState.log)
    ? persistedState.log.map((entry) => {
      const snapshot = entry?.snapshot
      if (!snapshot) return entry
      return {
        ...entry,
        snapshot: {
          ...snapshot,
          rules: sanitizeRules({ ...rules, ...(snapshot.rules ?? {}) }, numPlayers),
        },
      }
    })
    : []

  return {
    ...persistedState,
    players,
    numPlayers,
    rules,
    log,
  }
}

const useGameStore = create(
  persist(
    (set, get) => ({
      players: defaultPlayers(),
      dealer: 0,
      round: 1,
      honba: 0,
      riichiPool: 0,
      log: [],
      gameActive: false,
      gameType: 'hanchan',      // 'hanchan' | 'tonpuusen'
      entryMode: 'detailed',    // 'detailed' | 'quick'
      drawRule: 'fixed-pool',   // 'fixed-noten' | 'fixed-pool'
      numPlayers: 4,            // 3 | 4
      rules: createDefaultRules(4),

      startGame: (playerNames, gameType = 'hanchan', entryMode = 'detailed', drawRule = 'fixed-pool', numPlayers = 4, rulesOverrides = {}) => {
        const nextRules = sanitizeRules({ ...createDefaultRules(numPlayers), ...rulesOverrides }, numPlayers)
        return set({
          players: defaultPlayers(playerNames, nextRules.startScore),
          dealer: 0,
          round: 1,
          honba: 0,
          riichiPool: 0,
          log: [],
          gameActive: true,
          gameType,
          entryMode,
          drawRule,
          numPlayers,
          rules: nextRules,
        })
      },

      endGame: () => set({ gameActive: false }),

      setEntryMode: (mode) => set({ entryMode: mode }),
      setRules: (patch) =>
        set((state) => {
          const next = sanitizeRules({ ...state.rules, ...patch }, state.numPlayers)
          return { rules: next }
        }),

      updateScores: (deltas) =>
        set((state) => ({
          players: state.players.map((p, i) => ({
            ...p,
            score: p.score + (deltas[i] ?? 0),
          })),
        })),

      // Capture a snapshot of current state — call BEFORE making score changes
      // so that undo can restore to pre-hand state.
      getSnapshot: () => makeSnapshot(get()),

      // Entry must include a `snapshot` captured before any score changes.
      addLogEntry: ({ snapshot, ...entry }) =>
        set((state) => ({
          log: [...state.log, { ...entry, snapshot: snapshot ?? makeSnapshot(state) }],
        })),

      undoLastEntry: () =>
        set((state) => {
          if (state.log.length === 0) return {}
          const last = state.log[state.log.length - 1]
          const snap = last.snapshot
          return {
            log: state.log.slice(0, -1),
            players: snap.players,
            dealer: snap.dealer,
            round: snap.round,
            honba: snap.honba,
            riichiPool: snap.riichiPool,
            rules: snap.rules ? sanitizeRules(snap.rules, state.numPlayers) : state.rules,
          }
        }),

      // Undo back to (and including) the entry at `index`, restoring the
      // snapshot stored on that entry (i.e. state before that hand was played).
      undoToEntry: (index) =>
        set((state) => {
          if (index < 0 || index >= state.log.length) return {}
          const snap = state.log[index].snapshot
          return {
            log: state.log.slice(0, index),
            players: snap.players,
            dealer: snap.dealer,
            round: snap.round,
            honba: snap.honba,
            riichiPool: snap.riichiPool,
            rules: snap.rules ? sanitizeRules(snap.rules, state.numPlayers) : state.rules,
          }
        }),

      applyRiichiDeclaration: (playerIndex) =>
        set((state) => ({
          players: state.players.map((p, i) =>
            i === playerIndex ? { ...p, score: p.score - 1000 } : p
          ),
          riichiPool: state.riichiPool + 1,
        })),

      // Handles win: dealer win = renchan (honba++ only), non-dealer = advance round
      advanceAfterWin: ({ isDealer }) =>
        set((state) => {
          if (isDealer) {
            return { honba: state.honba + 1, riichiPool: 0 }
          }
          return {
            round: state.round + 1,
            dealer: (state.dealer + 1) % state.numPlayers,
            honba: 0,
            riichiPool: 0,
          }
        }),

      // Handles draw: dealer tenpai = renchan; dealer noten (or all noten) = advance
      advanceAfterDraw: ({ dealerTenpai, allTenpai = false }) =>
        set((state) => {
          const stayOnDraw = dealerTenpai && (!allTenpai || state.rules.allTenpaiDealerStays)
          if (stayOnDraw) {
            return { honba: state.honba + 1 }
          }
          return {
            round: state.round + 1,
            dealer: (state.dealer + 1) % state.numPlayers,
            honba: state.honba + 1,
          }
        }),

      setDealer: (index) => set({ dealer: index }),
      setRiichiPool: (pool) => set({ riichiPool: pool }),
    }),
    {
      name: 'riichi-game',
      version: 2,
      migrate: (persistedState) => migrateState(persistedState),
    }
  )
)

export const __testables = { migrateState }

export default useGameStore
