import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import CrashBoundary from './components/CrashBoundary.jsx'
import { initGlobalCrashHandlers } from './lib/crashReporter.js'

initGlobalCrashHandlers()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CrashBoundary>
      <App />
    </CrashBoundary>
  </StrictMode>,
)
