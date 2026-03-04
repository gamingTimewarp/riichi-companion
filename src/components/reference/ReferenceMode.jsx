import { useState, useEffect } from 'react'
import useHandStore from '../../stores/handStore.js'
import { YAKU_REF, TERMS } from '../../lib/referenceData.js'

// ─── Local sub-components ────────────────────────────────────────────────────

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex-1 py-1.5 text-sm font-medium rounded transition-colors',
        active ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function YakuCard({ yaku, achieved }) {
  return (
    <div
      className={[
        'rounded-lg border p-3 flex flex-col gap-1.5 transition-colors',
        achieved ? 'border-sky-600 bg-sky-900/20' : 'border-slate-700 bg-slate-800/40',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-sm font-semibold ${achieved ? 'text-sky-300' : 'text-slate-200'}`}>
          {yaku.name}
        </span>

        {yaku.isYakuman ? (
          <>
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700">
              Yakuman{yaku.isDoubleYakuman ? ' \u00d72' : ''}
            </span>
            {yaku.openHan === 0 && (
              <span className="text-xs text-slate-500">can be open</span>
            )}
            {yaku.openHan === null && (
              <span className="text-xs text-slate-500">closed only</span>
            )}
          </>
        ) : (
          <>
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
              {yaku.closedHan} han
            </span>
            {yaku.openHan !== null ? (
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-700">
                {yaku.openHan} open
              </span>
            ) : (
              <span className="text-xs text-slate-500">closed only</span>
            )}
          </>
        )}

        {achieved && (
          <span className="ml-auto text-xs text-sky-400 font-medium">&#10003; achieved</span>
        )}
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{yaku.description}</p>
    </div>
  )
}

function TermRow({ term }) {
  return (
    <div className="rounded border border-slate-700 bg-slate-800/40 px-3 py-2 flex flex-col gap-0.5">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-slate-200">{term.term}</span>
        <span className="text-xs text-slate-500">{term.reading}</span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{term.definition}</p>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ReferenceMode() {
  const analysisResult = useHandStore((s) => s.analysisResult)

  const [tab, setTab] = useState('yaku')
  const [search, setSearch] = useState('')
  const [showAchieved, setShowAchieved] = useState(false)

  // Reset achievable filter when switching tabs
  useEffect(() => {
    setShowAchieved(false)
  }, [tab])

  // Build set of achieved yaku keys from the current analysis result
  const achievedKeys = new Set(Object.keys(analysisResult?.yaku ?? {}))
  const hasAchieved = achievedKeys.size > 0

  // Filter yaku
  const filteredYaku = YAKU_REF.filter((y) => {
    if (showAchieved && !y.keys.some((k) => achievedKeys.has(k))) return false
    if (!search) return true
    const q = search.toLowerCase()
    return y.name.toLowerCase().includes(q) || y.description.toLowerCase().includes(q)
  })

  // Filter terms
  const filteredTerms = TERMS.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col gap-3 p-3 max-w-lg mx-auto">
      {/* Search bar */}
      <input
        type="search"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-sky-600"
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
        <Tab
          label={`Yaku (${filteredYaku.length})`}
          active={tab === 'yaku'}
          onClick={() => setTab('yaku')}
        />
        <Tab
          label={`Terms (${filteredTerms.length})`}
          active={tab === 'terms'}
          onClick={() => setTab('terms')}
        />
      </div>

      {/* Achievable filter toggle (yaku tab only) */}
      {tab === 'yaku' && (
        <button
          onClick={() => hasAchieved && setShowAchieved((p) => !p)}
          className={[
            'text-xs rounded-lg border px-3 py-2 transition-colors text-left',
            hasAchieved
              ? showAchieved
                ? 'border-sky-600 bg-sky-900/20 text-sky-300'
                : 'border-slate-600 bg-slate-800/60 text-slate-300 hover:border-sky-700 hover:text-sky-400'
              : 'border-slate-700 bg-slate-800/30 text-slate-500 cursor-default',
          ].join(' ')}
          title={
            !hasAchieved
              ? 'Complete a hand in the analyzer to filter by achieved yaku'
              : ''
          }
        >
          {showAchieved ? 'Showing: achieved yaku only' : 'Show achieved yaku only'}
          {!hasAchieved && (
            <span className="opacity-50 ml-1">(analyze a hand first)</span>
          )}
        </button>
      )}

      {/* Content */}
      {tab === 'yaku' ? (
        filteredYaku.length > 0 ? (
          filteredYaku.map((y) => (
            <YakuCard
              key={y.keys[0]}
              yaku={y}
              achieved={y.keys.some((k) => achievedKeys.has(k))}
            />
          ))
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">
            No yaku match your search.
          </p>
        )
      ) : filteredTerms.length > 0 ? (
        filteredTerms.map((t) => <TermRow key={t.term} term={t} />)
      ) : (
        <p className="text-sm text-slate-500 text-center py-8">
          No terms match your search.
        </p>
      )}
    </div>
  )
}
