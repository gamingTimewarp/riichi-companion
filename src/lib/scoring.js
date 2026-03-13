/**
 * Pure scoring/payment math for EMA ruleset.
 * No side effects — all functions take plain values and return plain values.
 */

const ROUND_NAMES = [
  '', // 1-indexed
  'East 1', 'East 2', 'East 3', 'East 4',
  'South 1', 'South 2', 'South 3', 'South 4',
]

export function getRoundName(round) {
  return ROUND_NAMES[round] ?? `Round ${round}`
}

// Returns riichi-ts wind integer: 27=East 28=South 29=West 30=North
export function getRoundWind(round) {
  return round <= 4 ? 27 : 28
}

export function getSeatWind(playerIdx, dealer, numPlayers = 4) {
  const offset = (playerIdx - dealer + numPlayers) % numPlayers
  return 27 + offset // 27=East 28=South 29=West 30=North
}

export function getSeatWindName(playerIdx, dealer, numPlayers = 4) {
  const names = ['East', 'South', 'West', 'North']
  const offset = (playerIdx - dealer + numPlayers) % numPlayers
  return names[offset]
}

// Standard base points table (dealer/non-dealer handled in calculatePayments)
// Returns base points before multiplier (fu * 2^(han+2))
export function calculateBasePoints(han, fu) {
  if (han >= 26) return 16000 // double yakuman
  if (han >= 13) return 8000  // (single) yakuman / kazoe
  if (han >= 11) return 8000  // sanbaiman
  if (han >= 8)  return 6000  // baiman
  if (han >= 6)  return 4000  // haneman
  if (han >= 5)  return 2000  // mangan

  const base = fu * Math.pow(2, han + 2)
  return Math.min(base, 2000) // cap at mangan
}

/**
 * Calculate payments for a winning hand.
 * Returns { deltas: number[4] } where positive = gain, negative = pay.
 *
 * @param {object} params
 * @param {number} params.han
 * @param {number} params.fu
 * @param {boolean} params.isTsumo
 * @param {number} params.winnerIndex   0–3
 * @param {number} params.discarderIndex 0–3 (ron only)
 * @param {number} params.dealerIndex   0–3
 * @param {number} params.honba
 * @param {number} params.riichiPool    number of 1000-point sticks
 */
export function calculatePayments({
  han,
  fu,
  isTsumo,
  winnerIndex,
  discarderIndex,
  dealerIndex,
  honba,
  riichiPool,
  numPlayers = 4,
  riichiStickValue = 1000,
  honbaValuePerPayer = 100,
}) {
  const deltas = new Array(numPlayers).fill(0)
  const base = calculateBasePoints(han, fu)
  const honbaBonus = honba * honbaValuePerPayer // per payer, per honba

  const isWinnerDealer = winnerIndex === dealerIndex

  if (isTsumo) {
    // Dealer tsumo: all non-dealers pay dealer value
    // Non-dealer tsumo: dealer pays dealer value, other non-dealers pay non-dealer value
    const dealerPay = roundUp100(base * 2)
    const nonDealerPay = roundUp100(base)

    for (let i = 0; i < numPlayers; i++) {
      if (i === winnerIndex) continue
      const pay = (isWinnerDealer || i === dealerIndex) ? dealerPay : nonDealerPay
      deltas[i] -= pay + honbaBonus
      deltas[winnerIndex] += pay + honbaBonus
    }
  } else {
    // Ron
    const total = isWinnerDealer
      ? roundUp100(base * 6)
      : roundUp100(base * 4)
    deltas[discarderIndex] -= total + honbaBonus * (numPlayers - 1)
    deltas[winnerIndex] += total + honbaBonus * (numPlayers - 1)
  }

  // Winner collects riichi pool
  deltas[winnerIndex] += riichiPool * riichiStickValue

  return { deltas }
}

function roundUp100(n) {
  return Math.ceil(n / 100) * 100
}

/**
 * Calculate draw (ryuukyoku) payments.
 *
 * Two rules:
 * - 'fixed-noten'  (EMA standard): each noten player pays 1000; tenpai split the total.
 *   2 tenpai → each noten pays 1000, each tenpai receives 1000.
 * - 'fixed-pool': total pot is always 3000; noten players split paying 3000,
 *   tenpai players split receiving 3000.
 *   2 tenpai → each noten pays 1500, each tenpai receives 1500.
 *
 * @param {number[]} tenpaiIndices  0–3 player indices who are tenpai
 * @param {'fixed-noten'|'fixed-pool'} rule
 */
export function calculateDrawPayments(tenpaiIndices, rule = 'fixed-noten', numPlayers = 4) {
  const deltas = new Array(numPlayers).fill(0)
  const tenpaiCount = tenpaiIndices.length
  if (tenpaiCount === 0 || tenpaiCount === numPlayers) return { deltas }

  const notenCount = numPlayers - tenpaiCount

  let eachNotenPays, eachTenpaiReceives
  if (rule === 'fixed-pool') {
    eachNotenPays = Math.ceil(3000 / notenCount)
    eachTenpaiReceives = Math.floor(3000 / tenpaiCount)
  } else {
    eachNotenPays = 1000
    eachTenpaiReceives = Math.floor((notenCount * 1000) / tenpaiCount)
  }

  for (let i = 0; i < numPlayers; i++) {
    if (tenpaiIndices.includes(i)) {
      deltas[i] += eachTenpaiReceives
    } else {
      deltas[i] -= eachNotenPays
    }
  }

  return { deltas }
}

/**
 * EMA end-of-game scoring.
 * Uma: 1st +15000, 2nd +5000, 3rd -5000, 4th -15000
 * Return target: 30000 (no oka)
 *
 * @param {Array<{name: string, score: number}>} players
 * @returns {{ finalScores, placement, uma, totals }}
 */
export function calculateFinalScores(players, { uma: inputUma, returnPts, oka = 0 } = {}) {
  const numPlayers = players.length
  const defaultUma = numPlayers === 3 ? [15000, 0, -15000] : [15000, 5000, -5000, -15000]
  const UMA = Array.isArray(inputUma) && inputUma.length >= numPlayers ? inputUma : defaultUma
  const returnTarget = typeof returnPts === 'number' ? returnPts : (numPlayers === 3 ? 35000 : 30000)

  // Sort by score descending, tracking original indices
  const ranked = players
    .map((p, i) => ({ ...p, index: i }))
    .sort((a, b) => b.score - a.score)

  const placement = new Array(numPlayers)
  const uma = new Array(numPlayers)
  const totals = new Array(numPlayers)

  ranked.forEach((p, rank) => {
    placement[p.index] = rank + 1
    uma[p.index] = UMA[rank]
    const okaBonus = rank === 0 ? oka : 0
    totals[p.index] = p.score - returnTarget + UMA[rank] + okaBonus
  })

  return {
    finalScores: players.map((p) => p.score),
    placement,
    uma,
    totals,
  }
}

/**
 * Chombo (penalty hand).
 * EMA: offender pays equivalent of mangan tsumo loss.
 * Non-dealer offender: 4000 to dealer, 2000 to each other non-dealer (8000 total).
 * Dealer offender: 4000 to each other player (12000 total).
 * Round does NOT advance; honba does NOT change.
 */
export function calculateChomboPayments(offenderIndex, dealerIndex, numPlayers = 4) {
  const deltas = new Array(numPlayers).fill(0)
  const isDealer = offenderIndex === dealerIndex
  for (let i = 0; i < numPlayers; i++) {
    if (i === offenderIndex) continue
    const receive = isDealer ? 4000 : (i === dealerIndex ? 4000 : 2000)
    deltas[i] += receive
    deltas[offenderIndex] -= receive
  }
  return { deltas }
}

/**
 * Nagashi mangan.
 * Player wins mangan tsumo. Treated as a draw for renchan purposes.
 * Uses calculatePayments with han=5 (mangan) and no honba/riichi pool bonus.
 */
export function calculateNagashiPayments(playerIndex, dealerIndex, numPlayers = 4) {
  return calculatePayments({
    han: 5, fu: 30,  // mangan — fu value doesn't matter at mangan+
    isTsumo: true,
    winnerIndex: playerIndex,
    discarderIndex: null,
    dealerIndex,
    honba: 0,
    riichiPool: 0,
    numPlayers,
  })
}

/**
 * Returns true if the game should end.
 * hanchan: ends after South 4 (round 8)
 * tonpuusen: ends after East 4 (round 4)
 */
export function shouldGameEnd(round, gameType) {
  const maxRound = gameType === 'tonpuusen' ? 4 : 8
  return round > maxRound
}
