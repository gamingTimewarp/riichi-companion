import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import AnalyzerMode from './components/analyzer/AnalyzerMode'
import TrackerMode from './components/tracker/TrackerMode'

function BottomNav() {
  const base = 'flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors'
  const active = 'text-sky-400'
  const inactive = 'text-slate-400 hover:text-slate-200'

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 flex z-50">
      <NavLink
        to="/analyzer"
        className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
      >
        <span className="text-xl">🀇</span>
        <span>Hand Analyzer</span>
      </NavLink>
      <NavLink
        to="/tracker"
        className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
      >
        <span className="text-xl">📊</span>
        <span>Game Tracker</span>
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
      </Routes>
    </BrowserRouter>
  )
}
