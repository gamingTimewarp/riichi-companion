import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Tauri CLI sets TAURI_ENV_TARGET_TRIPLE during its build; absent for plain web builds.
// Web builds are deployed under /riichi-companion/ so we must set the base path.
const isTauri = !!process.env.TAURI_ENV_TARGET_TRIPLE
const base = isTauri ? '/' : '/riichi-companion/'

export default defineConfig({
  base,
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: { ignored: ['**/src-tauri/**'] },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Riichi Companion',
        short_name: 'Riichi',
        description: 'Riichi Mahjong Hand Analyzer & Game Tracker',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: isTauri ? '/analyzer' : '/riichi-companion/analyzer',
        scope: isTauri ? '/' : '/riichi-companion/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
