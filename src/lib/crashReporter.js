const CRASH_LOG_KEY = 'riichi-crash-log'
const MAX_LOGS = 25

export const SUPPORT_BUNDLE_SCHEMA = 'riichi-support-bundle'
export const SUPPORT_BUNDLE_VERSION = 1

function safeJSONParse(raw) {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return { __parseError: true, raw }
  }
}

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

export function buildSupportBundle(extra = {}) {
  const payload = {
    schema: SUPPORT_BUNDLE_SCHEMA,
    version: SUPPORT_BUNDLE_VERSION,
    generatedAt: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    location: typeof window !== 'undefined' ? window.location?.href : 'unknown',
    crashLogs: getCrashLogs(),
    storage: {
      settings: typeof localStorage !== 'undefined' ? safeJSONParse(localStorage.getItem('riichi-settings')) : null,
      game: typeof localStorage !== 'undefined' ? safeJSONParse(localStorage.getItem('riichi-game')) : null,
    },
    ...extra,
  }
  return payload
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
