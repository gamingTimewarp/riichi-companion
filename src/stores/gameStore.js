import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const defaultPlayers = (names) =>
  (names || ['Player 1', 'Player 2', 'Player 3', 'Player 4']).map((name) => ({
    name,
    score: 30000,
  }))

const makeSnapshot = (state) => ({
  players: state.players.map((p) => ({ ...p })),
  dealer: state.dealer,
  round: state.round,
  honba: state.honba,
  riichiPool: state.riichiPool,
})

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

      startGame: (playerNames, gameType = 'hanchan', entryMode = 'detailed', drawRule = 'fixed-pool') =>
        set({
          players: defaultPlayers(playerNames),
          dealer: 0,
          round: 1,
          honba: 0,
          riichiPool: 0,
          log: [],
          gameActive: true,
          gameType,
          entryMode,
          drawRule,
        }),

      endGame: () => set({ gameActive: false }),

      setEntryMode: (mode) => set({ entryMode: mode }),

      updateScores: (deltas) =>
        set((state) => ({
          players: state.players.map((p, i) => ({
            ...p,
            score: p.score + (deltas[i] ?? 0),
          })),
        })),

      addLogEntry: (entry) =>
        set((state) => ({
          log: [...state.log, { ...entry, snapshot: makeSnapshot(state) }],
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
            dealer: (state.dealer + 1) % 4,
            honba: 0,
            riichiPool: 0,
          }
        }),

      // Handles draw: dealer tenpai = renchan; dealer noten (or all noten) = advance
      advanceAfterDraw: ({ dealerTenpai }) =>
        set((state) => {
          if (dealerTenpai) {
            return { honba: state.honba + 1 }
          }
          return {
            round: state.round + 1,
            dealer: (state.dealer + 1) % 4,
            honba: state.honba + 1,
          }
        }),

      setDealer: (index) => set({ dealer: index }),
      setRiichiPool: (pool) => set({ riichiPool: pool }),
    }),
    { name: 'riichi-game' }
  )
)

export default useGameStore
