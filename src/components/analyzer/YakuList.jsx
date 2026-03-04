// Maps riichi-ts yaku key names → display names
const YAKU_NAMES = {
  // Situational / bonus
  menzentsumo: 'Menzen Tsumo',
  riichi: 'Riichi',
  ippatsu: 'Ippatsu',
  'daburu riichi': 'Double Riichi',
  haitei: 'Haitei',
  houtei: 'Houtei',
  rinshan: 'Rinshan Kaihou',
  chankan: 'Chankan',
  // 1-han
  pinfu: 'Pinfu',
  tanyao: 'Tanyao',
  iipeikou: 'Iipeiko',
  haku: 'Haku',
  hatsu: 'Hatsu',
  chun: 'Chun',
  'own wind east': 'Seat Wind (East)',
  'own wind south': 'Seat Wind (South)',
  'own wind west': 'Seat Wind (West)',
  'own wind north': 'Seat Wind (North)',
  'round wind east': 'Round Wind (East)',
  'round wind south': 'Round Wind (South)',
  'round wind west': 'Round Wind (West)',
  'round wind north': 'Round Wind (North)',
  // 2-han
  chiitoitsu: 'Chiitoitsu',
  ittsu: 'Ittsu',
  sanshoku: 'Sanshoku Doujun',
  'sanshoku doukou': 'Sanshoku Doukou',
  chanta: 'Chanta',
  toitoi: 'Toitoi',
  sanankou: 'San Ankou',
  sankantsu: 'San Kantsu',
  honroutou: 'Honroutou',
  shosangen: 'Shou Sangen',
  // 3-han
  honitsu: 'Honitsu',
  junchan: 'Junchan',
  ryanpeikou: 'Ryanpeiko',
  // 6-han
  chinitsu: 'Chinitsu',
  // Yakuman
  kokushimusou: 'Kokushi Musou',
  'kokushimusou 13 sides': 'Kokushi (13-sided)',
  suuankou: 'Suu Ankou',
  'suuankou tanki': 'Suu Ankou Tanki',
  daisangen: 'Dai Sangen',
  shosuushi: 'Shou Suushii',
  daisuushi: 'Dai Suushii',
  tsuuiisou: 'Tsuiisou',
  chinroutou: 'Chinroutou',
  ryuuiisou: 'Ryuuiisou',
  chuurenpoto: 'Chuurenpoutou',
  'chuurenpoto 9 sides': 'Chuurenpoutou (9-sided)',
  suukantsu: 'Suu Kantsu',
  tenhou: 'Tenhou',
  chihou: 'Chiihou',
  renhou: 'Renhou',
  // Bonus
  dora: 'Dora',
  akadora: 'Aka Dora',
}

function displayName(key) {
  return YAKU_NAMES[key] ?? key
}

/**
 * Displays a list of yaku with han values.
 *
 * Props:
 *   yaku    — { [name: string]: number } — yaku from riichi-ts
 *   yakuman — number — yakuman multiplier (0 = none)
 */
export default function YakuList({ yaku, yakuman }) {
  const entries = Object.entries(yaku ?? {})

  if (entries.length === 0 && !yakuman) return null

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3 flex flex-col gap-2">
      <span className="text-sm font-semibold text-sky-400">Yaku</span>

      {yakuman > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-amber-300 font-bold">Yakuman</span>
          <span className="text-xs font-mono bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded">
            ×{yakuman}
          </span>
        </div>
      )}

      {entries.map(([key, han]) => (
        <div key={key} className="flex items-center justify-between">
          <span className="text-slate-200 text-sm">{displayName(key)}</span>
          <span className="text-xs font-mono bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
            {han} han
          </span>
        </div>
      ))}
    </div>
  )
}
