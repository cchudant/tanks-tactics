import styled from 'styled-components'
import { colors } from './colors'
import { GameState, Mode, MyState } from './types'

import assetInfo from './assets/info.svg'
import { useState } from 'react'
import { ConfirmModale } from './Modale'
import { usePost } from './useRequest'

const LoggedActionsCntr = styled.div`
  margin: 1.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: row;
  background-color: #ffffff;
`

const YouAre = styled.div<{ col: number }>`
  & .title {
    text-align: center;
    font-size: 1.5rem;
    padding-bottom: 0.5rem;
    min-width: 10rem;
  }
  & .table {
    display: flex;
    flex-direction: row;
    & > * {
      width: 50%;
    }
  }
  & .stats {
    text-align: right;
  }

  .color {
    color: ${opt => colors[opt.col]};
    font-weight: bold;
  }
  padding: 1rem;

  .dead {
    text-align: center;
    font-size: 1.3rem;
    color: #ee6767;
  }
`

const Buttons = styled.div`
  padding-left: 3rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
`

const Button = styled.button<{ disabled?: boolean; pressed?: boolean }>`
  padding: 0.4rem 0.4rem;
  font-size: 1.2rem;
  margin: 0.5rem;
  flex: 0 0 17rem;
  cursor: ${opt => (!opt.disabled ? 'pointer' : null)};
  background-color: ${opt => (opt.pressed ? '#b8b8b8' : '#e9e9ed')};
  display: flex;
  justify-content: center;
  border-radius: 3px;
  border: solid 1px black;

  &:not(:disabled):hover {
    background-color: #c2c2c2;
  }

  img {
    width: 1.1rem;
    height: 1.1rem;
    margin-left: 0.2rem;
  }
`

const tooltips = {
  giveAp: `\
Donner un AP à un joueur à portée de tir.
Coût : 1 AP`,
  upgradeRange: `\
Améliorer la portée de tir.
Coût : 3 AP`,
  attack: `\
Attaquer un joueur à portée de tir.
Coût : 1 AP`,
  giveHeart: `\
Donner un cœur à un joueur à portée de tir.
Coût : 1 AP`,
  move: `\
Se déplacer à une case adjacente.
Coût : 1 AP`,
  buyHeart: `\
Acheter un cœur.
Coût : 3 AP`,
}

const juryTooltip = `\
Les joueurs morts constituent un jury, qui peut voter tous les jours pour une personne vivante.
La personne obtenant le plus de vote n'obtiendra pas de point d'action pour la journée.`

const JuryVote = styled.div`
  padding-left: 3rem;

  .names {
    display: flex;
    flex-wrap: wrap;
  }

  .title {
    padding-bottom: 0.5rem;
    font-size: 1.6rem;
    img {
      width: 1.1rem;
      height: 1.1rem;
      padding-bottom: 0.5rem;
    }
    button {
      margin-left: 2rem;
    }
  }
`
const JuryVoteItem = styled.div<{ col: number }>`
  padding-left: 1.2rem;
  &:before {
    content: '';
    background-color: ${opt => colors[opt.col]};
    border-radius: 100%;
    width: 0.9rem;
    height: 0.9rem;
    margin-top: 2px;
    position: absolute;
    margin-left: -1.2rem;
  }
  min-height: 1.5rem;
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  padding-right: 2rem;
  flex: 0 0 1.5rem;
`

export function LoggedActions({
  myState,
  gameState,
  mode,
  setMode,
}: {
  myState: MyState
  gameState: GameState
  mode: Mode
  setMode: (mode: Mode) => void
}) {
  const myTank = gameState.tanks.find(tank => tank.name === myState.name)!

  const { call: upgradeRange } = usePost('/game/upgradeRange')
  const { call: buyHeart } = usePost('/game/buyHeart')
  const { call: juryVote } = usePost('/game/juryVote')

  const [confirm, setConfirm] = useState<{
    question: string
    description: string
    action: () => void
  } | null>(null)

  const myVote = myTank.hearts <= 0 ? myState.vote : undefined

  const [voteState, setVoteState] = useState<string | null>(null)

  const toggleMode = (m: Mode) => {
    setMode(mode === m ? null : m)
  }

  return (
    <LoggedActionsCntr>
      <YouAre col={myTank.color}>
        <div className="title">
          Vous êtes <span className="color">{myState.name}</span>
        </div>
        {myTank.hearts > 0 ? (
          <div className="table">
            <div>
              <div>Cœurs</div>
              <div>AP</div>
              <div>Portée</div>
            </div>
            <div className="stats">
              <div>{myTank.hearts}</div>
              <div>{myState.ap}</div>
              <div>{myState.range}</div>
            </div>
          </div>
        ) : (
          <div className="dead">Vous êtes mort</div>
        )}
      </YouAre>
      {myTank.hearts > 0 ? (
        <Buttons>
          <Button
            title={tooltips.giveAp}
            disabled={myState.ap < 1}
            onClick={() => toggleMode('giveAp')}
            pressed={mode === 'giveAp'}
          >
            Donner un AP <img src={assetInfo} />
          </Button>
          <Button
            title={tooltips.upgradeRange}
            disabled={myState.ap < 3}
            onClick={() =>
              setConfirm({
                question: 'Améliorer la portée',
                description: 'Coût: 3 AP',
                action: () => upgradeRange(),
              })
            }
          >
            Améliorer la portée <img src={assetInfo} />
          </Button>
          <Button
            title={tooltips.attack}
            disabled={myState.ap < 1}
            onClick={() => toggleMode('attack')}
            pressed={mode === 'attack'}
          >
            Attaquer <img src={assetInfo} />
          </Button>
          <Button
            title={tooltips.giveHeart}
            disabled={myState.ap < 1}
            onClick={() => toggleMode('giveHeart')}
            pressed={mode === 'giveHeart'}
          >
            Donner un cœur <img src={assetInfo} />
          </Button>
          <Button
            title={tooltips.move}
            disabled={myState.ap < 1}
            onClick={() => toggleMode('move')}
            pressed={mode === 'move'}
          >
            Se déplacer <img src={assetInfo} />
          </Button>
          <Button
            title={tooltips.buyHeart}
            disabled={myState.ap < 3}
            onClick={() =>
              setConfirm({
                question: 'Acheter un cœur',
                description: 'Coût: 3 AP',
                action: () => buyHeart(),
              })
            }
          >
            Acheter un cœur <img src={assetInfo} />
          </Button>
        </Buttons>
      ) : (
        <JuryVote>
          <div className="title" title={juryTooltip}>
            Vote du jury <img src={assetInfo} />{' '}
            <button
              disabled={!myVote}
              onClick={() => juryVote({ target: voteState })}
            >
              Envoyer le vote
            </button>
          </div>
          <div className="names">
            {gameState.tanks
              .filter(tank => tank.hearts > 0)
              .map(tank => (
                <JuryVoteItem col={tank.color} key={tank.name}>
                  {tank.name}
                  <input
                    type="radio"
                    name="juryVote"
                    disabled={!myVote}
                    checked={(myVote || voteState) === tank.name}
                    onChange={ev => setVoteState(ev.target.value)}
                  />
                </JuryVoteItem>
              ))}
          </div>
        </JuryVote>
      )}
      {confirm ? (
        <ConfirmModale
          question={confirm.question}
          description={confirm.description}
          onClose={() => {
            setConfirm(null)
          }}
          onConfirm={() => {
            confirm.action()
            setConfirm(null)
          }}
        />
      ) : null}
    </LoggedActionsCntr>
  )
}
