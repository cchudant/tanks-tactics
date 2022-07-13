import { useContext, useState } from 'react'
import styled from 'styled-components'

import { BoardEntity, GameBoard } from './Board'

import assetInfo from './assets/info.svg'
import assetHeart from './assets/heart.svg'
import assetSkullCrossbones from './assets/skull-crossbones.svg'

import { Route, BrowserRouter as Router, Switch } from 'react-router-dom'
import {
  SocketIOContext,
  SocketIOProvider,
  useLastSocketMessage,
} from './useSocketIo'
import { LoggedActions } from './LoggedActions'
import { GameState, MyState, TankEntity } from './types'
import { colors } from './colors'
import { Login } from './Login'
import { RequestProvider, usePost, useRequest } from './useRequest'
import { AdminActions } from './AdminActions'

const LegendCtnr = styled.div`
  margin-left: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 15rem;

  & .gamestate {
    font-size: 2rem;
    padding-bottom: 1rem;
    width: 100%;
    text-align: center;
    &.paused {
      color: orange;
    }
    &.unpaused {
      color: green;
    }
    &.endgame {
      color: red;
    }
    &.ended {
      color: gray;
    }
  }

  & .lastvote {
    padding-top: 1rem;
    font-size: 1rem;
  }

  & .rules {
    font-size: 1rem;
    color: inherit;
    & img {
      margin-right: 3px;
      margin-top: 7px;
      margin-bottom: -7px;
    }
  }

  & .players {
    flex: 1;
    width: 100%;
  }
`
const LegendItem = styled.div<{ col: number }>`
  padding-left: 1.5rem;
  width: 100%;
  &:before {
    content: '';
    background-color: ${opt => colors[opt.col % colors.length]};
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
  font-size: 1.7rem;

  .tankname.dead {
    text-decoration: line-through;
    color: #b0b0b0;
  }

  & .adminMode {
    font-size: 1rem;
    color: gray;
    margin-left: 0.3rem;
  }
`

function Legend({
  state,
  adminMode,
}: {
  state: GameState
  adminMode: boolean
}) {
  return (
    <LegendCtnr>
      {state.paused ? (
        <div className="gamestate paused">
          En pause (Jour {state.currentDay}/{state.endDay})
        </div>
      ) : state.end ? (
        <div className="gamestate ended">Jeu terminé</div>
      ) : state.isEndgame ? (
        <div className="gamestate endgame">Endgame</div>
      ) : (
        <div className="gamestate unpaused">
          Jour {state.currentDay}/{state.endDay}
        </div>
      )}
      <div className="players">
        {state.tanks.map(tank => (
          <LegendItem col={tank.color} key={tank.name}>
            <span className={tank.hearts > 0 ? 'tankname' : 'tankname dead'}>
              {tank.name}
            </span>
            {adminMode ? (
              <div className="adminMode">
                {tank.ap}AP {tank.range}R {tank.vote ? `V:${tank.vote}` : null}
              </div>
            ) : null}
          </LegendItem>
        ))}
        <div className="lastvote">
          {state.lastVoted ? `Voté au dernier tour : ${state.lastVoted}` : null}
        </div>
      </div>
      <a
        className="rules"
        href="https://hackmd.io/@CyPGy4EQT_eFoC-lAYE1_g/rJLa0VSMt"
      >
        <img src={assetInfo} />
        Règles du jeu
      </a>
    </LegendCtnr>
  )
}

const TankCtnr = styled.div<{ col: number }>`
  width: 50px;
  height: 50px;
  background-color: ${opt => colors[opt.col % colors.length]};
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

const DotDisplay = styled.div<{ colors: [string, string] }>`
  width: 100%;
  height: 100%;
  background-color: ${opt => opt.colors[0]};
  border: solid 1px ${opt => opt.colors[1]};
  box-sizing: border-box;
`

const EventTile = styled.div`
  width: 100%;
  height: 100%;
  cursor: pointer;
`

export interface BoardAction {
  actionName: string
  range?: number
  onClick: (x: number, y: number, target?: TankEntity) => boolean
  color: [string, string]
}
export interface BoardActionHelper {
  current: BoardAction | undefined
  setCurrent: (action?: BoardAction) => void
  toggleAction: (action: BoardAction) => void
}

function TankTacticsBoard({
  myState,
  state: gameState,
  ...opt
}: {
  myState: MyState | null
  state: GameState
  onLoggedIn: () => void
}) {
  const [currentBoardAction, setCurrentBoardAction] = useState<BoardAction>()
  const boardActions: BoardActionHelper = {
    current: currentBoardAction,
    setCurrent: setCurrentBoardAction,
    toggleAction: action =>
      currentBoardAction?.actionName === action.actionName
        ? setCurrentBoardAction(undefined)
        : setCurrentBoardAction(action),
  }

  const [adminMode, setAdminMode] = useState(false)
  const { data: session, refetch: refreshSession } = useRequest<{
    isDefaultPassword: boolean
    role: 'admin' | 'user'
  }>('/auth/session')

  const entities: BoardEntity[] = gameState.tanks.map(ent => ({
    x: ent.x,
    y: ent.y,
    display: <TankDisplay entity={ent} />,
    key: 'player-' + ent.name,
  }))

  if (currentBoardAction) {
    const myTank = gameState.tanks.find(tank => tank.name === myState?.name)!
    for (let y = 0; y < gameState.height; y++) {
      for (let x = 0; x < gameState.width; x++) {
        const otherTank = gameState.tanks.find(
          tank => tank.x === x && tank.y === y
        )

        if (currentBoardAction.range && myTank) {
          const dx = Math.abs(myTank.x - x)
          const dy = Math.abs(myTank.y - y)

          if (dx > currentBoardAction.range || dy > currentBoardAction.range)
            continue
        }

        if (!otherTank)
          entities.push({
            x,
            y,
            display: <DotDisplay colors={currentBoardAction.color} />,
            key: `dotDisp-${x}-${y}`,
          })

        entities.push({
          x,
          y,
          display: (
            <EventTile
              onClick={() => {
                if (currentBoardAction.onClick(x, y, otherTank))
                  setCurrentBoardAction(undefined)
              }}
            />
          ),
          key: `dot-${x}-${y}`,
        })
      }
    }
  }

  entities.push(
    ...gameState.hearts.map(heart => ({
      x: heart.x,
      y: heart.y,
      pointerEvents: false,
      display: <img src={assetHeart} width="40px" height="40px" style={{ 'pointerEvents': 'none' }} />,
      key: `heart-${heart.x}-${heart.y}`,
    }))
  )

  return (
    <div>
      <GameBoard
        width={gameState.width}
        height={gameState.height}
        showCoords={true}
        entities={entities}
        legend={<Legend state={gameState} adminMode={adminMode}></Legend>}
      />
      {session?.role === 'admin' && !session.isDefaultPassword ? (
        <AdminActions
          gameState={gameState}
          boardActions={boardActions}
          adminMode={adminMode}
          setAdminMode={setAdminMode}
        ></AdminActions>
      ) : myState && session && !session.isDefaultPassword ? (
        <LoggedActions
          gameState={gameState}
          myState={myState}
          boardActions={boardActions}
        ></LoggedActions>
      ) : (
        <Login
          onLoggedIn={() => {
            refreshSession()
            opt.onLoggedIn()
          }}
          session={session}
        ></Login>
      )}
    </div>
  )
}

const GameDiv = styled.div`
  .error {
    color: red;
  }
`

function Game() {
  type State = {
    myState: MyState | null
    gameState: GameState
  }

  const { data: fetchState, refetch: refreshState } =
    useRequest<State>('/game/state')
  const { data: socketState, setData: setSocketState } =
    useLastSocketMessage<State | null>('message', null)
  const socket = useContext(SocketIOContext)

  const state = socketState || fetchState

  console.log(state)

  return (
    <GameDiv>
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
    </GameDiv>
  )
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000'

function App() {
  return (
    <SocketIOProvider
      url={`${API_URL}/game`}
      opts={{
        transports: ['websocket'],
        withCredentials: true,
      }}
    >
      <RequestProvider apiUrl={API_URL}>
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
