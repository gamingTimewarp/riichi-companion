import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useProfileStore = create(
  persist(
    (set) => ({
      mode: 'casual', // 'casual' | 'learning'
      toggles: {
        showShanten: true,
        showFuBreakdown: false,
        showWaitType: true,
        showYakuHints: true,
        learningConfirmFlow: false,
      },
      setMode: (mode) => set({ mode }),
      setToggle: (key, value) =>
        set((state) => ({
          toggles: { ...state.toggles, [key]: value },
        })),
    }),
    { name: 'riichi-profile' }
  )
)

export default useProfileStore
