import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import AnalyzerMode from './components/analyzer/AnalyzerMode'
import TrackerMode from './components/tracker/TrackerMode'
import ReferenceMode from './components/reference/ReferenceMode'
import SettingsMode from './components/settings/SettingsMode'
import PrivacyMode from './components/settings/PrivacyMode'
import HistoryMode from './components/history/HistoryMode'

function BottomNav() {
  const base = 'flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors'
  const active = 'text-sky-400'
  const inactive = 'text-slate-400 hover:text-slate-200'

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 flex z-50">
      <NavLink to="/analyzer" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        <span className="text-xl leading-none">🀇</span>
        <span>Analyzer</span>
      </NavLink>
      <NavLink to="/tracker" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        <span className="text-xl leading-none">📊</span>
        <span>Tracker</span>
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        <span className="text-xl leading-none">🗒️</span>
        <span>History</span>
      </NavLink>
      <NavLink to="/reference" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        <span className="text-xl leading-none">📖</span>
        <span>Reference</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        <span className="text-xl leading-none">⚙️</span>
        <span>Settings</span>
      </NavLink>
    </nav>
  )
}

function TopBar({ title }) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-900 border-b border-slate-700 z-50 h-14 flex items-center px-4">
      <h1 className="text-lg font-bold text-sky-400 flex-1">Riichi Companion</h1>
      <span className="text-slate-300 text-sm">{title}</span>
    </header>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/analyzer" replace />} />
        <Route
          path="/analyzer"
          element={
            <>
              <TopBar title="Hand Analyzer" />
              <main className="pt-14 pb-16 min-h-dvh">
                <AnalyzerMode />
              </main>
              <BottomNav />
            </>
          }
        />
        <Route
          path="/tracker"
          element={
            <>
              <TopBar title="Game Tracker" />
              <main className="pt-14 pb-16 min-h-dvh">
                <TrackerMode />
              </main>
              <BottomNav />
            </>
          }
        />
        <Route
          path="/settings"
          element={
            <>
              <TopBar title="Settings" />
              <main className="pt-14 pb-16 min-h-dvh">
                <SettingsMode />
              </main>
              <BottomNav />
            </>
          }
        />

        <Route
          path="/privacy"
          element={
            <>
              <TopBar title="Privacy" />
              <main className="pt-14 pb-16 min-h-dvh">
                <PrivacyMode />
              </main>
              <BottomNav />
            </>
          }
        />

        <Route
          path="/history"
          element={
            <>
              <TopBar title="Game History" />
              <main className="pt-14 pb-16 min-h-dvh">
                <HistoryMode />
              </main>
              <BottomNav />
            </>
          }
        />

        <Route
          path="/reference"
          element={
            <>
              <TopBar title="Reference" />
              <main className="pt-14 pb-16 min-h-dvh">
                <ReferenceMode />
              </main>
              <BottomNav />
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
