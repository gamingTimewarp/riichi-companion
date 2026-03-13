import React from 'react'
import { captureCrash, clearCrashLogs, getCrashLogs } from '../lib/crashReporter'

export default class CrashBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, logsOpen: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    captureCrash(error, { source: 'react.error-boundary', componentStack: info?.componentStack })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const logs = getCrashLogs()
    return (
      <div className="min-h-dvh bg-slate-950 text-slate-100 p-6 space-y-4">
        <h1 className="text-xl font-bold text-rose-400">Unexpected error</h1>
        <p className="text-sm text-slate-300">The app hit an unrecoverable error. A local crash report was saved.</p>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-sky-700" onClick={() => window.location.reload()}>Reload app</button>
          <button className="px-3 py-2 rounded border border-slate-600" onClick={() => this.setState((s) => ({ logsOpen: !s.logsOpen }))}>
            {this.state.logsOpen ? 'Hide' : 'Show'} crash log ({logs.length})
          </button>
          <button className="px-3 py-2 rounded border border-slate-600" onClick={() => { clearCrashLogs(); this.forceUpdate() }}>
            Clear logs
          </button>
        </div>
        {this.state.logsOpen && (
          <pre className="text-xs whitespace-pre-wrap bg-slate-900 border border-slate-700 p-3 rounded max-h-[50vh] overflow-auto">
            {JSON.stringify(logs, null, 2)}
          </pre>
        )}
      </div>
    )
  }
}
