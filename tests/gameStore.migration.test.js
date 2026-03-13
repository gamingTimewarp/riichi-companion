import test from 'node:test'
import assert from 'node:assert/strict'

import { __testables } from '../src/stores/gameStore.js'

const { migrateState } = __testables

test('migrateState repairs malformed persisted state', () => {
  const migrated = migrateState({
    numPlayers: 8,
    players: [{ name: '', score: 'bad' }],
    rules: { startScore: 0, multipleRon: 'invalid', kazoeYakumanPolicy: 'invalid' },
    log: [{ snapshot: { players: [], rules: { redFives: { m: 9, p: -1, s: 0 } } } }],
  })

  assert.equal(migrated.numPlayers, 4)
  assert.equal(migrated.players.length, 1)
  assert.equal(migrated.players[0].name, 'Player 1')
  assert.equal(migrated.players[0].score, migrated.rules.startScore)
  assert.equal(migrated.rules.startScore, 10000)
  assert.equal(migrated.rules.multipleRon, 'allow')
  assert.equal(migrated.rules.kazoeYakumanPolicy, 'enabled')
  assert.deepEqual(migrated.log[0].snapshot.rules.redFives, { m: 2, p: 0, s: 0 })
})
