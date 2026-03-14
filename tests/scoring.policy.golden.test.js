import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import { calculatePayments } from '../src/lib/scoring.js'

const fixtures = JSON.parse(fs.readFileSync(new URL('./fixtures/scoring-policy-golden.json', import.meta.url), 'utf8'))

for (const fixture of fixtures) {
  test(`policy golden scoring: ${fixture.name}`, () => {
    const result = calculatePayments(fixture.input)
    assert.deepEqual(result.deltas, fixture.expectedDeltas)
  })
}
