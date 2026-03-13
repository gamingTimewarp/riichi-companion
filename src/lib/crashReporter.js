const CRASH_LOG_KEY = 'riichi-crash-log'
const MAX_LOGS = 25

function readLogs() {
  try {
    const raw = localStorage.getItem(CRASH_LOG_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getCrashLogs() {
  return readLogs()
}

export function clearCrashLogs() {
  try {
    localStorage.removeItem(CRASH_LOG_KEY)
  } catch {
    // ignore storage limitations
  }
}

export function captureCrash(error, context = {}) {
  const payload = {
    ts: new Date().toISOString(),
    message: error?.message || String(error),
    stack: error?.stack || null,
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  }

  try {
    const next = [payload, ...readLogs()].slice(0, MAX_LOGS)
    localStorage.setItem(CRASH_LOG_KEY, JSON.stringify(next))
  } catch {
    // ignore storage limitations
  }
}

export function initGlobalCrashHandlers() {
  if (typeof window === 'undefined') return

  window.addEventListener('error', (event) => {
    captureCrash(event?.error ?? new Error(event?.message ?? 'Unknown error'), {
      source: 'window.error',
      filename: event?.filename,
      lineno: event?.lineno,
      colno: event?.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason
    captureCrash(reason instanceof Error ? reason : new Error(String(reason)), {
      source: 'window.unhandledrejection',
    })
  })
}
