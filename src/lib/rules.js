export function getDefaultUma(numPlayers = 4) {
  return numPlayers === 3 ? [15000, 0, -15000] : [15000, 5000, -5000, -15000]
}

function getDefaultRedFives() {
  return { m: 1, p: 1, s: 1 }
}

export function createDefaultRules(numPlayers = 4) {
  const startScore = numPlayers === 3 ? 35000 : 30000
  return {
    preset: 'ema',
    startScore,
    returnPts: startScore,
    oka: 0,
    uma: getDefaultUma(numPlayers),
    riichiStickValue: 1000,
    honbaValuePerPayer: 100,
    bustEndsGame: false,
    allTenpaiDealerStays: true,
    openTanyao: true,
    redDoraEnabled: true,
    redFives: getDefaultRedFives(),
  }
}

export function normalizeUma(uma, numPlayers = 4) {
  const fallback = getDefaultUma(numPlayers)
  if (!Array.isArray(uma)) return fallback
  const cleaned = uma.slice(0, numPlayers).map((v) => Number(v) || 0)
  if (cleaned.length < numPlayers) {
    return [...cleaned, ...fallback.slice(cleaned.length)]
  }
  return cleaned
}

export function normalizeRedFives(redFives) {
  const base = getDefaultRedFives()
  const src = redFives ?? {}
  return {
    m: Math.max(0, Math.min(2, Number(src.m ?? base.m) || 0)),
    p: Math.max(0, Math.min(2, Number(src.p ?? base.p) || 0)),
    s: Math.max(0, Math.min(2, Number(src.s ?? base.s) || 0)),
  }
}

export function presetRules(preset = 'ema', numPlayers = 4) {
  const base = createDefaultRules(numPlayers)
  if (preset === 'wrc') {
    return {
      ...base,
      preset,
      openTanyao: false,
      redDoraEnabled: false,
      redFives: { m: 0, p: 0, s: 0 },
      bustEndsGame: true,
    }
  }
  if (preset === 'mleague') {
    return {
      ...base,
      preset,
      openTanyao: true,
      redDoraEnabled: true,
      redFives: { m: 1, p: 1, s: 1 },
      bustEndsGame: true,
      allTenpaiDealerStays: true,
      oka: 0,
      uma: numPlayers === 3 ? [15000, 0, -15000] : [30000, 10000, -10000, -30000],
    }
  }
  return { ...base, preset: 'ema' }
}

export function sanitizeRules(rules, numPlayers = 4) {
  const defaults = createDefaultRules(numPlayers)
  const next = { ...defaults, ...(rules ?? {}) }
  const toNum = (value, fallback) => {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
  }
  return {
    ...next,
    startScore: Math.max(10000, toNum(next.startScore, defaults.startScore)),
    returnPts: Math.max(10000, toNum(next.returnPts, defaults.returnPts)),
    oka: toNum(next.oka, 0),
    riichiStickValue: Math.max(100, toNum(next.riichiStickValue, defaults.riichiStickValue)),
    honbaValuePerPayer: Math.max(0, toNum(next.honbaValuePerPayer, defaults.honbaValuePerPayer)),
    uma: normalizeUma(next.uma, numPlayers),
    redFives: normalizeRedFives(next.redFives),
  }
}

export function getRulesValidationErrors(rules, numPlayers = 4) {
  const r = sanitizeRules(rules, numPlayers)
  const errors = []
  if (r.startScore <= 0) errors.push('Start score must be greater than 0.')
  if (r.returnPts <= 0) errors.push('Return points must be greater than 0.')
  if (r.riichiStickValue <= 0) errors.push('Riichi stick value must be greater than 0.')
  if (r.honbaValuePerPayer < 0) errors.push('Honba per payer cannot be negative.')
  if ((r.redFives.m + r.redFives.p + r.redFives.s) > 4) {
    errors.push('Total red fives across suits cannot exceed 4.')
  }
  if (r.uma.length !== numPlayers) errors.push('Uma list must match player count.')
  return errors
}
