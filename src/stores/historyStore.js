import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Persisted store for completed game records.
 * Each entry is saved when the user clicks "New Game" at the end-game screen.
 *
 * Schema per game:
 *   id          — unique identifier
 *   date        — ISO date string (time of save)
 *   gameType    — 'hanchan' | 'tonpuusen'
 *   numPlayers  — 3 | 4
 *   players     — [{ name, score }]  final scores
 *   rules       — game rules object
 *   log         — full hand log array
 */
const useHistoryStore = create(
  persist(
    (set) => ({
      games: [],

      saveGame: (gameData) => {
        const entry = {
          id: `game-${Date.now()}`,
          date: new Date().toISOString(),
          ...gameData,
        }
        set((state) => ({ games: [entry, ...state.games] }))
        return entry.id
      },

      deleteGame: (id) =>
        set((state) => ({ games: state.games.filter((g) => g.id !== id) })),

      clearHistory: () => set({ games: [] }),
    }),
    { name: 'riichi-history' }
  )
)

export default useHistoryStore
