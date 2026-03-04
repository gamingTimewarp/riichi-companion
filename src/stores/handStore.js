import { create } from 'zustand'

const useHandStore = create((set) => ({
  tiles: [],           // TileObject[] — closed hand tiles
  melds: [],           // { open: boolean, tiles: TileObject[] }[]
  discards: [],        // TileObject[]
  analysisResult: null, // result from analysis.js

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
  clearHand: () => set({ tiles: [], melds: [], discards: [], analysisResult: null }),
  setAnalysisResult: (result) => set({ analysisResult: result }),
  setDiscards: (discards) => set({ discards }),
}))

export default useHandStore
