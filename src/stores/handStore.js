import { create } from 'zustand'

const makePlayerDiscards = () =>
  Array.from({ length: 4 }, () => ({ tiles: [], anyClaimed: false }))

const useHandStore = create((set) => ({
  tiles: [],            // TileObject[] — closed hand tiles
  melds: [],            // { open: boolean, tiles: TileObject[] }[]
  analysisResult: null, // result from analysis.js

  // Per-player discard tracking: 4 entries, each { tiles: TileObject[], anyClaimed: boolean }
  // Player 0 = "You" (the hand being analysed). Used for furiten + nagashi detection.
  playerDiscards: makePlayerDiscards(),

  setTiles: (tiles) => set({ tiles, analysisResult: null }),
  addTile: (tile) =>
    set((state) => ({ tiles: [...state.tiles, tile], analysisResult: null })),
  removeTile: (index) =>
    set((state) => ({
      tiles: state.tiles.filter((_, i) => i !== index),
      analysisResult: null,
    })),
  addMeld: (meld) =>
    set((state) => ({ melds: [...state.melds, meld], analysisResult: null })),
  removeMeld: (index) =>
    set((state) => ({
      melds: state.melds.filter((_, i) => i !== index),
      analysisResult: null,
    })),
  clearHand: () => set({ tiles: [], melds: [], playerDiscards: makePlayerDiscards(), analysisResult: null }),
  setAnalysisResult: (result) => set({ analysisResult: result }),

  addDiscard: (playerIdx, tile) =>
    set((state) => {
      const pd = state.playerDiscards.map((p, i) =>
        i === playerIdx ? { ...p, tiles: [...p.tiles, tile] } : p
      )
      return { playerDiscards: pd }
    }),

  removeDiscard: (playerIdx, tileIdx) =>
    set((state) => {
      const pd = state.playerDiscards.map((p, i) =>
        i === playerIdx ? { ...p, tiles: p.tiles.filter((_, ti) => ti !== tileIdx) } : p
      )
      return { playerDiscards: pd }
    }),

  setAnyClaimed: (playerIdx, val) =>
    set((state) => {
      const pd = state.playerDiscards.map((p, i) =>
        i === playerIdx ? { ...p, anyClaimed: val } : p
      )
      return { playerDiscards: pd }
    }),

  clearPlayerDiscards: (playerIdx) =>
    set((state) => {
      const pd = state.playerDiscards.map((p, i) =>
        i === playerIdx ? { tiles: [], anyClaimed: false } : p
      )
      return { playerDiscards: pd }
    }),
}))

export default useHandStore
