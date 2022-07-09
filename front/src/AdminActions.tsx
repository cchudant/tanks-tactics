import styled from 'styled-components'
import { GameState } from './types'

import { useState } from 'react'
import {
  ConfirmModale,
  FormModale,
  FormModaleField,
  InfoModale,
} from './Modale'
import { usePost } from './useRequest'
import { BoardActionHelper } from './App'

const LoggedActionsCntr = styled.div`
  margin: 1.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: row;
  background-color: #ffffff;
  & .title {
    color: #e14effff;
    font-weight: 900;
    text-align: center;
    font-size: 1.5rem;
    padding-bottom: 0.5rem;
    min-width: 10rem;
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

export function AdminActions({
  gameState,
  adminMode,
  setAdminMode,
  boardActions,
}: {
  gameState: GameState
  adminMode: boolean
  setAdminMode: (adminMode: boolean) => void
  boardActions: BoardActionHelper
}) {
  const { call: createUserCall } = usePost('/auth/createUser')
  const { call: resetPasswordCall } = usePost('/auth/resetPassword')
  const { call: addAPCall } = usePost('/game/admin/addAP')
  const { call: addHeartsCall } = usePost('/game/admin/addHearts')
  const { call: addRangeCall } = usePost('/game/admin/addRange')
  const { call: setPausedCall } = usePost('/game/admin/setPaused')
  const { call: moveCall } = usePost('/game/admin/move')
  const { call: changeVoteCall } = usePost('/game/admin/changeVote')
  const { call: removeHeartsCall } = usePost('/game/admin/removeHearts')
  const { call: addMapHeartCall } = usePost('/game/admin/addMapHeart')
  const { call: triggerResetJobCall } = usePost('/game/admin/triggerResetJob')
  const { call: resetEverythingCall } = usePost('/game/admin/resetEverything')
  const { call: setCurrentDayCall } = usePost('/game/admin/setCurrentDay')

  const [formModale, setFormModale] = useState<
    Parameters<typeof FormModale>[0] | null
  >(null)
  const [infoModale, setInfoModale] = useState<
    Parameters<typeof InfoModale>[0] | null
  >(null)

  return (
    <LoggedActionsCntr>
      <div className="title">ADMIN MODE</div>
      <Buttons>
        <Button
          onClick={() =>
            setFormModale({
              title: 'Créer un utilisateur',
              fields: [{ name: 'username', placeholder: 'Utilisateur' }],
              onSubmit: async ({ username }) => {
                const ret = await createUserCall({ username })
                setInfoModale({
                  title: 'Utilisateur créé',
                  description: (
                    <span>
                      Son mot de passe est : <code>{ret.password}</code>
                    </span>
                  ),
                })
              },
            })
          }
        >
          Créer un utilisateur
        </Button>
        <Button
          onClick={() =>
            setFormModale({
              title: 'Réinitialiser le mot de passe',
              fields: [{ name: 'username', placeholder: 'Utilisateur' }],
              onSubmit: async ({ username }) => {
                const ret = await resetPasswordCall({ username })
                setInfoModale({
                  title: 'Mot de passe réinitialisé',
                  description: (
                    <span>
                      Son nouveau mot de passe est : <code>{ret.password}</code>
                    </span>
                  ),
                })
              },
            })
          }
        >
          Réinitialiser le mot de passe
        </Button>
        <Button
          onClick={() =>
            setFormModale({
              title: 'Ajouter/Retirer AP',
              fields: [
                { name: 'target', placeholder: 'Utilisateur' },
                { name: 'amount', placeholder: 'Quantité (+/-)' },
              ],
              onSubmit: async ({ target, amount }) =>
                addAPCall({ target, amount: +amount }),
            })
          }
        >
          Ajouter/Retirer AP
        </Button>
        <Button
          onClick={() =>
            setFormModale({
              title: 'Ajouter/Retirer Cœurs',
              fields: [
                { name: 'target', placeholder: 'Utilisateur' },
                { name: 'amount', placeholder: 'Quantité (+/-)' },
              ],
              onSubmit: async ({ target, amount }) =>
                addHeartsCall({ target, amount: +amount }),
            })
          }
        >
          Ajouter/Retirer Cœurs
        </Button>
        <Button
          onClick={() =>
            setFormModale({
              title: 'Ajouter/Retirer Portée',
              fields: [
                { name: 'target', placeholder: 'Utilisateur' },
                { name: 'amount', placeholder: 'Quantité (+/-)' },
              ],
              onSubmit: async ({ target, amount }) =>
                addRangeCall({ target, amount: +amount }),
            })
          }
        >
          Ajouter/Retirer Portée
        </Button>
        <Button
          onClick={() =>
            setPausedCall({ paused: !gameState.paused }).catch(err =>
              setInfoModale({
                title: 'Erreur',
                description: err.message,
              })
            )
          }
        >
          {gameState.paused ? 'Reprendre/Démarrer' : 'Mettre en pause'}
        </Button>
        <Button onClick={() => setAdminMode(!adminMode)}>
          {!adminMode ? 'Afficher infos admin' : 'Cacher infos admin'}
        </Button>
        <Button
          onClick={() =>
            setFormModale({
              title: 'Déplacer tank',
              fields: [{ name: 'target', placeholder: 'Utilisateur' }],
              onSubmit: ({ target }) =>
                boardActions.toggleAction({
                  actionName: 'adminMove',
                  color: ['#d1ffd0', '#5bb36a'],
                  onClick: (x, y, t) => {
                    if (t) return false

                    moveCall({ target, x, y })

                    return true
                  },
                  range: 1,
                }),
            })
          }
        >
          Déplacer tank
        </Button>
        <Button
          onClick={() =>
            setFormModale({
              title: 'Changer le vote',
              fields: [
                { name: 'target', placeholder: 'Utilisateur' },
                { name: 'vote', placeholder: 'Vote (vide si aucun)' },
              ],
              onSubmit: ({ target, vote }) =>
                changeVoteCall({ target, vote: vote || undefined }),
            })
          }
        >
          Changer le vote
        </Button>
        <Button onClick={() => removeHeartsCall()}>
          Supprimer les cœurs map
        </Button>
        <Button
          onClick={() =>
            boardActions.toggleAction({
              actionName: 'adminAddMapHeart',
              color: ['#d1ffd0', '#5bb36a'],
              onClick: (x, y, t) => {
                if (t) return false

                addMapHeartCall({ x, y })

                return true
              },
              range: 1,
            })
          }
        >
          Ajouter un cœur map
        </Button>
        <Button onClick={() => triggerResetJobCall()}>Reset journalier</Button>
        <Button
          onClick={() =>
            setFormModale({
              title: 'Reset everything',
              fields: [
                { name: 'width', placeholder: 'Board width (optional)' },
                { name: 'height', placeholder: 'Board height (optional)' },
                { name: 'endDay', placeholder: 'End day (optional)' },
              ],
              onSubmit: ({ width, height, endDay }) =>
                resetEverythingCall({
                  width: width ? +width : undefined,
                  height: height ? +height : undefined,
                  endDay: endDay ? +endDay : undefined,
                }),
            })
          }
        >
          Reset everything
        </Button>
        <Button
          onClick={() =>
            setFormModale({
              title: 'Jour courant',
              fields: [{ name: 'currentDay', placeholder: 'Jour courant' }],
              onSubmit: ({ currentDay }) =>
                setCurrentDayCall({ currentDay: +currentDay }),
            })
          }
        >
          Jour courant
        </Button>
      </Buttons>

      {formModale ? (
        <FormModale
          title={formModale.title}
          description={formModale.description}
          fields={formModale.fields}
          onClose={() => setFormModale(null)}
          onSubmit={async data => {
            await formModale.onSubmit(data)
            setFormModale(null)
          }}
        />
      ) : null}
      {infoModale ? (
        <InfoModale
          title={infoModale.title}
          description={infoModale.description}
          onClose={() => setInfoModale(null)}
        />
      ) : null}
    </LoggedActionsCntr>
  )
}
