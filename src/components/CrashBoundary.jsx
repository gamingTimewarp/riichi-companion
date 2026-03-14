import React from 'react'
import { buildSupportBundle, captureCrash, clearCrashLogs, getCrashLogs } from '../lib/crashReporter'

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

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
        <div className="flex gap-2 flex-wrap">
          <button className="px-3 py-2 rounded bg-sky-700" onClick={() => window.location.reload()}>Reload app</button>
          <button className="px-3 py-2 rounded border border-slate-600" onClick={() => this.setState((s) => ({ logsOpen: !s.logsOpen }))}>
            {this.state.logsOpen ? 'Hide' : 'Show'} crash log ({logs.length})
          </button>
          <button className="px-3 py-2 rounded border border-slate-600" onClick={() => { clearCrashLogs(); this.forceUpdate() }}>
            Clear logs
          </button>
          <button
            className="px-3 py-2 rounded border border-emerald-700 text-emerald-300"
            onClick={() => {
              const bundle = buildSupportBundle({
                source: 'crash-boundary',
                note: 'Generated from crash recovery UI',
              })
              downloadJSON(bundle, `riichi-support-bundle-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`)
            }}
          >
            Download support bundle
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
