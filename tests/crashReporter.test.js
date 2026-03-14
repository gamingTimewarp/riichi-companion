import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildSupportBundle,
  captureCrash,
  clearCrashLogs,
  getCrashLogs,
  SUPPORT_BUNDLE_SCHEMA,
  SUPPORT_BUNDLE_VERSION,
} from '../src/lib/crashReporter.js'

function createMemoryStorage() {
  const store = new Map()
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
}

test('captureCrash stores logs and clearCrashLogs resets them', () => {
  globalThis.localStorage = createMemoryStorage()
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'test-agent' }, configurable: true })

  clearCrashLogs()
  captureCrash(new Error('boom'), { source: 'unit-test' })

  const logs = getCrashLogs()
  assert.equal(logs.length, 1)
  assert.equal(logs[0].message, 'boom')
  assert.equal(logs[0].context.source, 'unit-test')

  clearCrashLogs()
  assert.equal(getCrashLogs().length, 0)
})

test('buildSupportBundle includes schema/version and persisted state payloads', () => {
  globalThis.localStorage = createMemoryStorage()
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'test-agent-2' }, configurable: true })

  localStorage.setItem('riichi-settings', JSON.stringify({ state: { version: 2 } }))
  localStorage.setItem('riichi-game', JSON.stringify({ state: { round: 3 } }))
  captureCrash(new Error('bundle-test'), { source: 'bundle' })

  const bundle = buildSupportBundle({ note: 'integration' })

  assert.equal(bundle.schema, SUPPORT_BUNDLE_SCHEMA)
  assert.equal(bundle.version, SUPPORT_BUNDLE_VERSION)
  assert.equal(bundle.note, 'integration')
  assert.equal(bundle.crashLogs.length, 1)
  assert.equal(bundle.storage.settings.state.version, 2)
  assert.equal(bundle.storage.game.state.round, 3)
})
