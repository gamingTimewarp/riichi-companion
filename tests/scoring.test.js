import test from 'node:test'
import assert from 'node:assert/strict'

import { calculateDrawPayments, calculateFinalScores, calculatePayments } from '../src/lib/scoring.js'

test('calculateDrawPayments returns no score movement when everyone is tenpai', () => {
  const { deltas } = calculateDrawPayments([0, 1, 2, 3], 'fixed-pool', 4)
  assert.deepEqual(deltas, [0, 0, 0, 0])
})

test('calculateDrawPayments returns no score movement when nobody is tenpai', () => {
  const { deltas } = calculateDrawPayments([], 'fixed-noten', 4)
  assert.deepEqual(deltas, [0, 0, 0, 0])
})

test('calculateDrawPayments uses fixed-pool split values correctly', () => {
  const { deltas } = calculateDrawPayments([1, 2], 'fixed-pool', 4)
  assert.deepEqual(deltas, [-1500, 1500, 1500, -1500])
})

test('calculatePayments honors custom honba and riichi-stick values', () => {
  const { deltas } = calculatePayments({
    han: 1,
    fu: 30,
    isTsumo: false,
    winnerIndex: 0,
    discarderIndex: 1,
    dealerIndex: 2,
    honba: 2,
    riichiPool: 3,
    numPlayers: 4,
    honbaValuePerPayer: 300,
    riichiStickValue: 2000,
  })

  // Base ron 1han30fu non-dealer = 1000, honba adds 2*300*3 = 1800, pool adds 6000
  assert.equal(deltas[0], 8800)
  assert.equal(deltas[1], -2800)
})

test('calculateFinalScores applies custom return, uma, and oka', () => {
  const players = [
    { name: 'A', score: 32000 },
    { name: 'B', score: 30000 },
    { name: 'C', score: 28000 },
    { name: 'D', score: 26000 },
  ]
  const { totals } = calculateFinalScores(players, {
    returnPts: 30000,
    uma: [20000, 5000, -5000, -20000],
    oka: 10000,
  })

  assert.deepEqual(totals, [32000, 5000, -7000, -24000])
})
