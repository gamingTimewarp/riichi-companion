import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createDefaultRules,
  getRulesValidationErrors,
  normalizeRedFives,
  normalizeUma,
  presetRules,
  sanitizeRules,
} from '../src/lib/rules.js'

test('createDefaultRules returns 4-player defaults', () => {
  const rules = createDefaultRules(4)
  assert.equal(rules.startScore, 30000)
  assert.equal(rules.returnPts, 30000)
  assert.deepEqual(rules.uma, [15000, 5000, -5000, -15000])
  assert.equal(rules.openTanyao, true)
  assert.equal(rules.redDoraEnabled, true)
})

test('createDefaultRules returns 3-player defaults', () => {
  const rules = createDefaultRules(3)
  assert.equal(rules.startScore, 35000)
  assert.equal(rules.returnPts, 35000)
  assert.deepEqual(rules.uma, [15000, 0, -15000])
})

test('normalizeUma pads/truncates and coerces values', () => {
  assert.deepEqual(normalizeUma([10000, '5000'], 4), [10000, 5000, -5000, -15000])
  assert.deepEqual(normalizeUma([1, 2, 3, 4, 5], 4), [1, 2, 3, 4])
})

test('normalizeRedFives clamps each suit between 0 and 2', () => {
  assert.deepEqual(normalizeRedFives({ m: -1, p: 1, s: 3 }), { m: 0, p: 1, s: 2 })
})

test('presetRules applies WRC-like restrictions', () => {
  const rules = presetRules('wrc', 4)
  assert.equal(rules.openTanyao, false)
  assert.equal(rules.redDoraEnabled, false)
  assert.deepEqual(rules.redFives, { m: 0, p: 0, s: 0 })
  assert.equal(rules.bustEndsGame, true)
})

test('presetRules includes mleague-like option', () => {
  const rules = presetRules('mleague', 4)
  assert.equal(rules.redDoraEnabled, true)
  assert.deepEqual(rules.uma, [30000, 10000, -10000, -30000])
  assert.equal(rules.bustEndsGame, true)
})

test('sanitizeRules clamps important numeric ranges', () => {
  const rules = sanitizeRules({ startScore: 0, returnPts: -1, riichiStickValue: -100, honbaValuePerPayer: -5, redFives: { m: 9, p: -2, s: 1 } }, 4)
  assert.equal(rules.startScore, 10000)
  assert.equal(rules.returnPts, 10000)
  assert.equal(rules.riichiStickValue, 100)
  assert.equal(rules.honbaValuePerPayer, 0)
  assert.deepEqual(rules.redFives, { m: 2, p: 0, s: 1 })
})

test('getRulesValidationErrors flags excessive red fives total', () => {
  const errors = getRulesValidationErrors({ redFives: { m: 2, p: 2, s: 2 }, redDoraEnabled: true }, 4)
  assert.ok(errors.some((e) => e.includes('Total red fives')))
})
