import { calculateFinalScores } from './scoring.js'

/**
 * Formats a total score (in raw points) as a signed thousands string.
 * e.g. 42100 → "+42.1k",  -3200 → "-3.2k"
 */
function fmtTotal(total) {
  const sign = total > 0 ? '+' : ''
  return `${sign}${(total / 1000).toFixed(1)}k`
}

/**
 * Formats a date string for display.
 * e.g. "2026-04-17T..." → "April 17, 2026"
 */
function fmtDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Generates a shareable plain-text game summary.
 *
 * @param {object} game — a history store entry (players, rules, gameType, numPlayers, log, date)
 * @returns {string}
 */
export function generateSummaryText(game) {
  const { players, rules, gameType, numPlayers, log, date } = game

  const umaArr = rules?.uma?.slice(0, numPlayers) ??
    (numPlayers === 3 ? [15000, 0, -15000] : [15000, 5000, -5000, -15000])
  const returnPts = rules?.returnPts ?? (numPlayers === 3 ? 35000 : 30000)
  const oka = rules?.oka ?? 0

  const { placement, uma, totals } = calculateFinalScores(players, {
    uma: umaArr,
    returnPts,
    oka,
  })

  const ranked = players
    .map((p, i) => ({ ...p, placement: placement[i], uma: uma[i], total: totals[i] }))
    .sort((a, b) => a.placement - b.placement)

  const ORDINALS = ['1st', '2nd', '3rd', '4th']
  const gameTypeLabel = gameType === 'tonpuusen' ? 'Tonpuusen' : 'Hanchan'
  const handsNote = log?.length ? ` · ${log.length} hand${log.length !== 1 ? 's' : ''}` : ''
  const dateNote = fmtDate(date)

  const lines = [
    `🀇 ${gameTypeLabel} (${numPlayers}P)${dateNote ? ` · ${dateNote}` : ''}${handsNote}`,
    '',
    ...ranked.map((p) => {
      const ord = ORDINALS[p.placement - 1] ?? `${p.placement}.`
      const umaStr = `Uma ${p.uma > 0 ? '+' : ''}${(p.uma / 1000).toFixed(0)}k`
      return `${ord}  ${p.name}: ${fmtTotal(p.total)}  (${p.score.toLocaleString()}pt · ${umaStr})`
    }),
    '',
    `Uma: ${umaArr.map((v) => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(0)}k`).join(' / ')}  ·  Return: ${returnPts.toLocaleString()}`,
    oka !== 0 ? `Oka: ${oka > 0 ? '+' : ''}${oka.toLocaleString()}` : null,
    '',
    'via Riichi Companion',
  ]

  return lines.filter((l) => l !== null).join('\n')
}
