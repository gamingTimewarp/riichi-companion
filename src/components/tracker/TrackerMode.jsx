import { useState } from 'react'
import useGameStore from '../../stores/gameStore'
import GameSetup from './GameSetup'
import DiceRoller from './DiceRoller'
import GameScreen from './GameScreen'
import HandEntrySheet from './HandEntrySheet'
import DrawEntrySheet from './DrawEntrySheet'
import ChomboSheet from './ChomboSheet'
import NagashiSheet from './NagashiSheet'
import EndGameScreen from './EndGameScreen'
import { shouldGameEnd } from '../../lib/scoring'

function BustModal({ bustInfo, onEndGame, onContinue }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
      <div className="w-full max-w-md mx-auto bg-slate-900 border-t border-slate-700 rounded-t-2xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-rose-400">Bust!</h3>
          <p className="text-slate-300 text-sm mt-1">
            <span className="font-semibold text-white">{bustInfo.name}</span> has gone below zero
            ({bustInfo.score.toLocaleString()} pts).
          </p>
        </div>
        <p className="text-slate-500 text-xs">
          Some rulesets end the game immediately on a bust. Others allow play to continue until the end of the round.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onContinue}
            className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:border-slate-400 transition-colors"
          >
            Continue
          </button>
          <button
            onClick={onEndGame}
            className="flex-1 py-3 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-sm font-semibold transition-colors"
          >
            End Game
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TrackerMode() {
  const { gameActive, players, round, gameType } = useGameStore()
  const gameOver = gameActive && shouldGameEnd(round, gameType)

  const initialScreen = gameActive ? (gameOver ? 'end' : 'game') : 'setup'
  const [screen, setScreen] = useState(initialScreen)
  const [bustInfo, setBustInfo] = useState(null)

  // Per-hand riichi tracking: survives wall-dice navigation, resets after hand/draw
  // States: 'none' | 'riichi' | 'double'
  const [riichiFlags, setRiichiFlags] = useState(() => players.map(() => 'none'))
  const resetRiichi = () => setRiichiFlags(players.map(() => 'none'))
  const toggleRiichi = (i) =>
    setRiichiFlags((prev) => {
      const n = [...prev]
      const curr = n[i]
      n[i] = curr === 'none' ? 'riichi' : curr === 'riichi' ? 'double' : 'none'
      return n
    })

  function afterHand() {
    resetRiichi()
    const state = useGameStore.getState()
    if (shouldGameEnd(state.round, state.gameType)) {
      setScreen('end')
      return
    }
    const busted = state.players.find((p) => p.score < 0)
    if (busted) {
      if (state.rules.bustEndsGame) {
        setScreen('end')
        return
      }
      setBustInfo({ name: busted.name, score: busted.score })
    }
    setScreen('game')
  }

  function afterChombo() {
    const state = useGameStore.getState()
    const busted = state.players.find((p) => p.score < 0)
    if (busted) {
      if (state.rules.bustEndsGame) {
        setScreen('end')
        return
      }
      setBustInfo({ name: busted.name, score: busted.score })
    }
    setScreen('game')
  }

  return (
    <div>
      {bustInfo && (
        <BustModal
          bustInfo={bustInfo}
          onContinue={() => setBustInfo(null)}
          onEndGame={() => { setBustInfo(null); setScreen('end') }}
        />
      )}

      {screen === 'setup' && (
        <GameSetup onStart={() => setScreen('dice')} />
      )}
      {screen === 'dice' && (
        <DiceRoller
          mode="dealer"
          players={players}
          onConfirmDealer={() => setScreen('game')}
          onDone={() => setScreen('game')}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          onHandEntry={() => setScreen('hand-entry')}
          onDrawEntry={() => setScreen('draw-entry')}
          onNagashi={() => setScreen('nagashi')}
          onChombo={() => setScreen('chombo')}
          onWallDice={() => setScreen('wall-dice')}
          onEndGame={() => setScreen('end')}
          riichiFlags={riichiFlags}
          onToggleRiichi={toggleRiichi}
        />
      )}
      {screen === 'hand-entry' && (
        <HandEntrySheet
          riichiFlags={riichiFlags}
          onConfirm={afterHand}
          onCancel={() => setScreen('game')}
        />
      )}
      {screen === 'draw-entry' && (
        <DrawEntrySheet
          riichiFlags={riichiFlags}
          onConfirm={afterHand}
          onCancel={() => setScreen('game')}
        />
      )}
      {screen === 'chombo' && (
        <ChomboSheet
          onConfirm={afterChombo}
          onCancel={() => setScreen('game')}
        />
      )}
      {screen === 'nagashi' && (
        <NagashiSheet
          onConfirm={afterHand}
          onCancel={() => setScreen('game')}
        />
      )}
      {screen === 'wall-dice' && (
        <DiceRoller
          mode="wall"
          onDone={() => setScreen('game')}
        />
      )}
      {screen === 'end' && (
        <EndGameScreen onNewGame={() => setScreen('setup')} />
      )}
    </div>
  )
}
