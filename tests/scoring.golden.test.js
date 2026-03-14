import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import { calculateBasePoints } from '../src/lib/scoring.js'

const fixtures = JSON.parse(fs.readFileSync(new URL('./fixtures/scoring-golden.json', import.meta.url), 'utf8'))

for (const fixture of fixtures) {
  test(`golden scoring: ${fixture.name}`, () => {
    const { han, fu, opts } = fixture.input
    assert.equal(calculateBasePoints(han, fu, opts), fixture.expectedBase)
  })
}
