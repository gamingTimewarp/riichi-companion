import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const defaultPlayers = () => [
  { name: 'Player 1', score: 25000 },
  { name: 'Player 2', score: 25000 },
  { name: 'Player 3', score: 25000 },
  { name: 'Player 4', score: 25000 },
]

const useGameStore = create(
  persist(
    (set, get) => ({
      players: defaultPlayers(),
      dealer: 0,       // player index (0–3)
      round: 1,        // 1 = East 1
      honba: 0,
      riichiPool: 0,   // 1000-point sticks in pool
      log: [],         // HandLogEntry[]
      gameActive: false,

      startGame: (playerNames) =>
        set({
          players: playerNames.map((name) => ({ name, score: 25000 })),
          dealer: 0,
          round: 1,
          honba: 0,
          riichiPool: 0,
          log: [],
          gameActive: true,
        }),

      endGame: () => set({ gameActive: false }),

      updateScores: (deltas) =>
        set((state) => ({
          players: state.players.map((p, i) => ({
            ...p,
            score: p.score + (deltas[i] ?? 0),
          })),
        })),

      addLogEntry: (entry) =>
        set((state) => ({ log: [...state.log, entry] })),

      undoLastEntry: () =>
        set((state) => {
          const log = state.log.slice(0, -1)
          // Recompute scores from scratch
          const players = defaultPlayers().map((p, i) => ({
            ...p,
            name: state.players[i].name,
          }))
          for (const entry of log) {
            entry.deltas.forEach((d, i) => {
              players[i].score += d
            })
          }
          return { log, players }
        }),

      setRiichiPool: (pool) => set({ riichiPool: pool }),
      advanceRound: () =>
        set((state) => ({
          round: state.round + 1,
          dealer: (state.dealer + 1) % 4,
          honba: 0,
        })),
      addHonba: () => set((state) => ({ honba: state.honba + 1 })),
    }),
    { name: 'riichi-game' }
  )
)

export default useGameStore
