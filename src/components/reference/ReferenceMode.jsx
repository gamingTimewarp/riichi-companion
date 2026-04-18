import { useState } from 'react'
import useHandStore from '../../stores/handStore.js'
import { YAKU_REF, TERMS } from '../../lib/referenceData.js'
import { parseNotation, tileToUnicode } from '../../lib/tiles.js'

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

const SUIT_COLOR = { m: 'text-rose-300', p: 'text-sky-300', s: 'text-emerald-300', z: 'text-violet-300' }

const DIFFICULTY_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
const DIFFICULTY_COLOR = {
  beginner: 'text-emerald-400 border-emerald-700/50 bg-emerald-900/20',
  intermediate: 'text-amber-400 border-amber-700/50 bg-amber-900/20',
  advanced: 'text-rose-400 border-rose-700/50 bg-rose-900/20',
}

// Han filter options: null = all, 1/2/3/6 = specific closed han, 'yakuman' = yakuman
const HAN_OPTIONS = [null, 1, 2, 3, 6, 'yakuman']
const HAN_LABEL = { null: 'All', 1: '1', 2: '2', 3: '3', 6: '6', yakuman: 'Yak' }

// Open/closed filter: null = all, 'open' = can be open, 'closed' = closed only
const OPEN_OPTIONS = [null, 'open', 'closed']
const OPEN_LABEL = { null: 'All', open: 'Can open', closed: 'Closed only' }

function ExampleHand({ notation }) {
  if (!notation) return null
  const { tiles } = parseNotation(notation)
  if (!tiles.length) return null
  return (
    <div className="flex flex-wrap gap-0.5 pt-0.5">
      {tiles.map((t, i) => (
        <span key={i} className={`text-lg leading-none ${SUIT_COLOR[t.suit] ?? 'text-slate-300'}`}>
          {tileToUnicode(t)}
        </span>
      ))}
    </div>
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

        {yaku.difficulty && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${DIFFICULTY_COLOR[yaku.difficulty]}`}>
            {DIFFICULTY_LABEL[yaku.difficulty]}
          </span>
        )}

        {yaku.unofficial && (
          <span className="text-[10px] px-1.5 py-0.5 rounded border text-orange-400 border-orange-700/50 bg-orange-900/20">
            House Rule
          </span>
        )}

        {achieved && (
          <span className="ml-auto text-xs text-sky-400 font-medium">&#10003; achieved</span>
        )}
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{yaku.description}</p>
      {yaku.example && <ExampleHand notation={yaku.example} />}
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

// ─── Filter row helper ───────────────────────────────────────────────────────

function FilterRow({ label, options, value, onChange, labelMap, activeClass }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-slate-500 w-10 shrink-0 text-right">{label}</span>
      {options.map((opt) => (
        <button
          key={opt ?? 'all'}
          onClick={() => onChange(opt)}
          className={[
            'flex-1 py-1 rounded border text-xs font-medium transition-colors',
            value === opt
              ? activeClass(opt)
              : 'border-slate-700 bg-slate-800/40 text-slate-500 hover:text-slate-300 hover:border-slate-600',
          ].join(' ')}
        >
          {labelMap[opt ?? 'null'] ?? labelMap[String(opt)] ?? opt}
        </button>
      ))}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ReferenceMode() {
  const analysisResult = useHandStore((s) => s.analysisResult)

  const [tab, setTab] = useState('yaku')
  const [search, setSearch] = useState('')
  const [showAchieved, setShowAchieved] = useState(false)
  const [difficultyFilter, setDifficultyFilter] = useState(null) // null | 'beginner' | 'intermediate' | 'advanced'
  const [hanFilter, setHanFilter] = useState(null) // null | 1 | 2 | 3 | 6 | 'yakuman'
  const [openFilter, setOpenFilter] = useState(null) // null | 'open' | 'closed'
  const [showUnofficial, setShowUnofficial] = useState(false)

  function setTabAndReset(nextTab) {
    setTab(nextTab)
    setShowAchieved(false)
    setHanFilter(null)
    setOpenFilter(null)
  }

  // Build set of achieved yaku keys from the current analysis result
  const achievedKeys = new Set(Object.keys(analysisResult?.yaku ?? {}))
  const hasAchieved = achievedKeys.size > 0

  // Filter yaku
  const filteredYaku = YAKU_REF.filter((y) => {
    if (!showUnofficial && y.unofficial) return false
    if (showAchieved && !y.keys.some((k) => achievedKeys.has(k))) return false
    if (difficultyFilter && y.difficulty !== difficultyFilter) return false

    if (hanFilter !== null) {
      if (hanFilter === 'yakuman') {
        if (!y.isYakuman) return false
      } else {
        if (y.isYakuman) return false
        if (y.closedHan !== hanFilter) return false
      }
    }

    if (openFilter === 'open' && y.openHan === null) return false
    if (openFilter === 'closed' && y.openHan !== null) return false

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
          onClick={() => setTabAndReset('yaku')}
        />
        <Tab
          label={`Terms (${filteredTerms.length})`}
          active={tab === 'terms'}
          onClick={() => setTabAndReset('terms')}
        />
      </div>

      {/* Yaku tab filters */}
      {tab === 'yaku' && (
        <div className="flex flex-col gap-2">
          {/* Difficulty filter */}
          <FilterRow
            label="Level"
            options={[null, 'beginner', 'intermediate', 'advanced']}
            value={difficultyFilter}
            onChange={setDifficultyFilter}
            labelMap={{ null: 'All', beginner: 'Beg', intermediate: 'Mid', advanced: 'Adv' }}
            activeClass={(opt) =>
              opt === null
                ? 'bg-slate-700 border-slate-500 text-slate-100'
                : `border ${DIFFICULTY_COLOR[opt]}`
            }
          />

          {/* Han filter */}
          <FilterRow
            label="Han"
            options={HAN_OPTIONS}
            value={hanFilter}
            onChange={setHanFilter}
            labelMap={{ null: 'All', '1': '1', '2': '2', '3': '3', '6': '6', yakuman: 'Yak' }}
            activeClass={() => 'bg-slate-700 border-slate-500 text-slate-100'}
          />

          {/* Open/closed filter */}
          <FilterRow
            label="Style"
            options={OPEN_OPTIONS}
            value={openFilter}
            onChange={setOpenFilter}
            labelMap={{ null: 'All', open: 'Can open', closed: 'Closed' }}
            activeClass={() => 'bg-slate-700 border-slate-500 text-slate-100'}
          />

          {/* Unofficial toggle */}
          <button
            onClick={() => setShowUnofficial((p) => !p)}
            className={[
              'text-xs rounded-lg border px-3 py-2 transition-colors text-left',
              showUnofficial
                ? 'border-orange-700/60 bg-orange-900/20 text-orange-300'
                : 'border-slate-700 bg-slate-800/40 text-slate-500 hover:border-slate-600 hover:text-slate-400',
            ].join(' ')}
          >
            {showUnofficial ? 'Showing: includes house rules' : 'Show unofficial / house rule yaku'}
          </button>

          {/* Achieved filter */}
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
            title={!hasAchieved ? 'Complete a hand in the analyzer to filter by achieved yaku' : ''}
          >
            {showAchieved ? 'Showing: achieved yaku only' : 'Show achieved yaku only'}
            {!hasAchieved && <span className="opacity-50 ml-1">(analyze a hand first)</span>}
          </button>
        </div>
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
