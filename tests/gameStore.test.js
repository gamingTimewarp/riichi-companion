import test from 'node:test'
import assert from 'node:assert/strict'

import useGameStore from '../src/stores/gameStore.js'
import { createDefaultRules } from '../src/lib/rules.js'

function resetStore() {
  useGameStore.setState({
    players: [
      { name: 'P1', score: 30000 },
      { name: 'P2', score: 30000 },
      { name: 'P3', score: 30000 },
      { name: 'P4', score: 30000 },
    ],
    dealer: 0,
    round: 1,
    honba: 0,
    riichiPool: 0,
    log: [],
    gameActive: true,
    gameType: 'hanchan',
    entryMode: 'detailed',
    drawRule: 'fixed-pool',
    numPlayers: 4,
    rules: createDefaultRules(4),
  })
}

test('advanceAfterDraw keeps dealer when dealerTenpai is true (all-player tenpai case)', () => {
  resetStore()
  useGameStore.getState().advanceAfterDraw({ dealerTenpai: true })

  const state = useGameStore.getState()
  assert.equal(state.dealer, 0)
  assert.equal(state.round, 1)
  assert.equal(state.honba, 1)
})

test('advanceAfterDraw rotates dealer when dealerTenpai is false', () => {
  resetStore()
  useGameStore.getState().advanceAfterDraw({ dealerTenpai: false })

  const state = useGameStore.getState()
  assert.equal(state.dealer, 1)
  assert.equal(state.round, 2)
  assert.equal(state.honba, 1)
})

test('advanceAfterDraw can rotate on all-tenpai when toggle is disabled', () => {
  resetStore()
  useGameStore.setState((state) => ({ rules: { ...state.rules, allTenpaiDealerStays: false } }))
  useGameStore.getState().advanceAfterDraw({ dealerTenpai: true, allTenpai: true })

  const state = useGameStore.getState()
  assert.equal(state.dealer, 1)
  assert.equal(state.round, 2)
  assert.equal(state.honba, 1)
})

test('startGame applies rule overrides for score-related values', () => {
  resetStore()
  useGameStore.getState().startGame(
    ['A', 'B', 'C', 'D'],
    'hanchan',
    'detailed',
    'fixed-pool',
    4,
    {
      startScore: 25000,
      returnPts: 25000,
      riichiStickValue: 1500,
      honbaValuePerPayer: 200,
      bustEndsGame: true,
      allTenpaiDealerStays: false,
      uma: [20000, 5000, -5000, -20000],
    },
  )

  const state = useGameStore.getState()
  assert.deepEqual(state.players.map((p) => p.score), [25000, 25000, 25000, 25000])
  assert.equal(state.rules.returnPts, 25000)
  assert.equal(state.rules.riichiStickValue, 1500)
  assert.equal(state.rules.honbaValuePerPayer, 200)
  assert.equal(state.rules.bustEndsGame, true)
  assert.equal(state.rules.allTenpaiDealerStays, false)
  assert.deepEqual(state.rules.uma, [20000, 5000, -5000, -20000])
})

test('startGame supports high-priority compatibility toggles', () => {
  resetStore()
  useGameStore.getState().startGame(
    ['A', 'B', 'C', 'D'],
    'hanchan',
    'detailed',
    'fixed-pool',
    4,
    {
      openTanyao: false,
      redDoraEnabled: true,
      redFives: { m: 2, p: 0, s: 1 },
      oka: 10000,
    },
  )

  const state = useGameStore.getState()
  assert.equal(state.rules.openTanyao, false)
  assert.equal(state.rules.redDoraEnabled, true)
  assert.deepEqual(state.rules.redFives, { m: 2, p: 0, s: 1 })
  assert.equal(state.rules.oka, 10000)
})

test('startGame normalizes red-five overrides', () => {
  resetStore()
  useGameStore.getState().startGame(
    ['A', 'B', 'C', 'D'],
    'hanchan',
    'detailed',
    'fixed-pool',
    4,
    {
      redFives: { m: -1, p: 4, s: 1 },
    },
  )

  const state = useGameStore.getState()
  assert.deepEqual(state.rules.redFives, { m: 0, p: 2, s: 1 })
})

test('getSnapshot includes rules for export/replay parity', () => {
  resetStore()
  useGameStore.getState().setRules({ riichiStickValue: 1500, openTanyao: false })

  const snapshot = useGameStore.getState().getSnapshot()
  assert.equal(snapshot.rules.riichiStickValue, 1500)
  assert.equal(snapshot.rules.openTanyao, false)
})

test('undoLastEntry restores rules from snapshot', () => {
  resetStore()
  const before = useGameStore.getState().getSnapshot()
  useGameStore.getState().addLogEntry({ snapshot: before, label: 'test', type: 'draw', deltas: [0, 0, 0, 0] })

  useGameStore.getState().setRules({ riichiStickValue: 1800, openTanyao: false })
  assert.equal(useGameStore.getState().rules.riichiStickValue, 1800)

  useGameStore.getState().undoLastEntry()
  const state = useGameStore.getState()
  assert.equal(state.rules.riichiStickValue, before.rules.riichiStickValue)
  assert.equal(state.rules.openTanyao, before.rules.openTanyao)
})
