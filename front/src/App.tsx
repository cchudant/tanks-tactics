import { useContext, useState } from 'react'
import styled from 'styled-components'

import { BoardEntity, GameBoard } from './Board'

import assetHeart from './assets/heart.svg'
import assetSkullCrossbones from './assets/skull-crossbones.svg'

import { Route, BrowserRouter as Router, Switch } from 'react-router-dom'
import {
  SocketIOContext,
  SocketIOProvider,
  useLastSocketMessage,
} from './useSocketIo'
import { LoggedActions } from './LoggedActions'
import { GameState, MyState, TankEntity, Mode } from './types'
import { colors } from './colors'
import { Login } from './Login'
import { RequestProvider, usePost, useRequest } from './useRequest'

const LegendCtnr = styled.div`
  margin-left: 2rem;
`
const LegendItem = styled.div<{ col: number }>`
  padding-left: 1.5rem;
  &:before {
    content: '';
    background-color: ${opt => colors[opt.col]};
    border-radius: 100%;
    width: 1.2rem;
    height: 1.2rem;
    margin-top: 2px;
    position: absolute;
    margin-left: -1.5rem;
  }
  min-height: 2rem;
  display: flex;
  align-items: center;
  font-size: 2rem;
`

function Legend({ state }: { state: GameState }) {
  return (
    <LegendCtnr>
      {state.tanks.map(tank => (
        <LegendItem col={tank.color} key={tank.name}>
          {tank.name}
        </LegendItem>
      ))}
    </LegendCtnr>
  )
}

const TankCtnr = styled.div<{ col: number }>`
  width: 50px;
  height: 50px;
  background-color: ${opt => colors[opt.col]};
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.1rem;
  & > span {
    margin-top: -1px;
    margin-right: -1px;
  }
  & > img {
    width: 29px;
    height: 29px;
  }
`
function TankDisplay({ entity }: { entity: TankEntity }) {
  return (
    <TankCtnr col={entity.color}>
      {entity.hearts ? (
        <>
          <span>{entity.hearts}</span>
          <img src={assetHeart} />
        </>
      ) : (
        <img src={assetSkullCrossbones} />
      )}
    </TankCtnr>
  )
}

const dotColors = {
  giveAp: ['#fff1b3', '#adb35b'],
  attack: ['#ffb3b3', '#b35b5b'],
  giveHeart: ['#d1ffd0', '#5bb36a'],
  move: ['#d0fffb', '#5bb39d'],
}
const DotDisplay = styled.div<{ mode: Mode }>`
  width: 100%;
  height: 100%;
  background-color: ${opt => dotColors[opt.mode!][0]};
  border: solid 1px ${opt => dotColors[opt.mode!][1]};
  box-sizing: border-box;
`

const EventTile = styled.div`
  width: 100%;
  height: 100%;
  cursor: pointer;
`

function TankTacticsBoard({
  myState,
  state: gameState,
  ...opt
}: {
  myState: MyState | null
  state: GameState
  onLoggedIn: () => void
}) {
  const [mode, setMode] = useState<Mode>(null)
  const { call: moveCall } = usePost('/game/move')
  const { call: giveApCall } = usePost('/game/giveApToPlayer')
  const { call: giveHeartCall } = usePost('/game/giveHeartToPlayer')
  const { call: attackCall } = usePost('/game/attack')
  const { data: session, refetch: refreshSession } = useRequest<{ isDefaultPassword: boolean }>(
    '/auth/session'
  )

  const entities: BoardEntity[] = gameState.tanks.map(ent => ({
    x: ent.x,
    y: ent.y,
    display: <TankDisplay entity={ent} />,
    key: 'player-' + ent.name,
  }))

  entities.push(
    ...gameState.hearts.map(heart => ({
      x: heart.x,
      y: heart.y,
      display: <img src={assetHeart} width="40px" height="40px" />,
      key: `heart-${heart.x}-${heart.y}`,
    }))
  )

  const myTank =
    myState && gameState.tanks.find(tank => tank.name === myState.name)!
  if (myState && mode && myTank!.hearts > 0) {
    const range = mode === 'move' ? 1 : myState.range
    // moving
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const x = myTank!.x + dx
        const y = myTank!.y + dy
        if (x < 0 || x >= gameState.width || y < 0 || y >= gameState.height)
          continue

        const otherTank = gameState.tanks.find(
          tank => tank.x === x && tank.y === y
        )
        if (otherTank === myTank) continue

        if (!otherTank)
          entities.push({
            x,
            y,
            display: <DotDisplay mode={mode} />,
            key: `dotDisp-${x}-${y}`,
          })

        if (mode === 'move') {
          if (!otherTank) {
            entities.push({
              x,
              y,
              display: (
                <EventTile onClick={() => moveCall({ x, y })} />
              ),
              key: `dot-${x}-${y}`,
            })
          }
        } else if (mode === 'attack') {
          if (otherTank) {
            entities.push({
              x,
              y,
              display: (
                <EventTile
                  onClick={() => attackCall({ target: otherTank.name })}
                />
              ),
              key: `dot-${x}-${y}`,
            })
          }
        } else if (mode === 'giveAp') {
          if (otherTank) {
            entities.push({
              x,
              y,
              display: (
                <EventTile
                  onClick={() => giveApCall({ target: otherTank.name })}
                />
              ),
              key: `dot-${x}-${y}`,
            })
          }
        } else if (mode === 'giveHeart') {
          if (otherTank) {
            entities.push({
              x,
              y,
              display: (
                <EventTile
                  onClick={() => giveHeartCall({ target: otherTank.name })}
                />
              ),
              key: `dot-${x}-${y}`,
            })
          }
        }
      }
    }
  }

  return (
    <div>
      <GameBoard
        width={gameState.width}
        height={gameState.height}
        showCoords={true}
        entities={entities}
        legend={<Legend state={gameState}></Legend>}
      />
      {myState && session && !session.isDefaultPassword ? (
        <LoggedActions
          gameState={gameState}
          myState={myState}
          mode={mode}
          setMode={setMode}
        ></LoggedActions>
      ) : (
        <Login onLoggedIn={() => {
          refreshSession()
          opt.onLoggedIn()
        }} session={session}></Login>
      )}
    </div>
  )
}

function Game() {
  type State = {
    myState: MyState | null
    gameState: GameState
  }

  const { data: fetchState, refetch: refreshState } = useRequest<State>('/game/state')
  const {
    data: socketState,
    setData: setSocketState,
  } = useLastSocketMessage<State | null>('message', null)
  const socket = useContext(SocketIOContext)

  const state = socketState || fetchState

  console.log(state)

  return (
    <div>
      {state ? (
        <div>
          <TankTacticsBoard
            myState={state.myState}
            state={state.gameState}
            onLoggedIn={() => {
              socket!.disconnect()
              socket!.connect()
              setSocketState(null)
              refreshState()
            }}
          />
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  )
}

function App() {
  return (
    <SocketIOProvider
      url={`${process.env.REACT_APP_API_URL}/game`}
      opts={{
        transports: ['websocket'],
        withCredentials: true,
      }}
    >
      <RequestProvider apiUrl={process.env.REACT_APP_API_URL!}>
        <Router>
          <Switch>
            <Route path="/" component={Game} />
          </Switch>
        </Router>
      </RequestProvider>
    </SocketIOProvider>
  )
}

export default App
