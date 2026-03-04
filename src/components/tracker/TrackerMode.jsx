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

export default function TrackerMode() {
  const { gameActive, players, round, gameType } = useGameStore()
  const gameOver = gameActive && shouldGameEnd(round, gameType)

  const initialScreen = gameActive ? (gameOver ? 'end' : 'game') : 'setup'
  const [screen, setScreen] = useState(initialScreen)

  return (
    <div>
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
        />
      )}
      {screen === 'hand-entry' && (
        <HandEntrySheet
          onConfirm={() => {
            const { round, gameType } = useGameStore.getState()
            setScreen(shouldGameEnd(round, gameType) ? 'end' : 'game')
          }}
          onCancel={() => setScreen('game')}
        />
      )}
      {screen === 'draw-entry' && (
        <DrawEntrySheet
          onConfirm={() => {
            const { round, gameType } = useGameStore.getState()
            setScreen(shouldGameEnd(round, gameType) ? 'end' : 'game')
          }}
          onCancel={() => setScreen('game')}
        />
      )}
      {screen === 'chombo' && (
        <ChomboSheet
          onConfirm={() => setScreen('game')}
          onCancel={() => setScreen('game')}
        />
      )}
      {screen === 'nagashi' && (
        <NagashiSheet
          onConfirm={() => {
            const { round, gameType } = useGameStore.getState()
            setScreen(shouldGameEnd(round, gameType) ? 'end' : 'game')
          }}
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
