import { FormEvent, useEffect, useState } from 'react'
import styled from 'styled-components'
import { Modale } from './Modale'
import { usePost } from './useRequest'

const LoggedActionsCntr = styled.form`
  margin: 1.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: row;
  background-color: #ffffff;
  div {
    display: flex;
    flex-direction: column;
    text-align: center;
    align-items: center;
    font-size: 1.4rem;
    * {
      width: 15rem;
    }
    input,
    button {
      margin-top: 0.5rem;
    }
  }
`

export function Login(opt: {
  onLoggedIn: () => void
  session: { isDefaultPassword: boolean } | null
}) {
  const { call: login, result: loginRes } = usePost<{
    isDefaultPassword: boolean
  }>('/auth/login')
  const { call: setPasswordCall } = usePost(
    '/auth/setPassword'
  )

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault()
    login({ username, password })
  }

  const firstLogin =
    (loginRes && loginRes.isDefaultPassword) || (opt.session && opt.session.isDefaultPassword)

  return (
    <>
      <LoggedActionsCntr onSubmit={onSubmit}>
        <div>
          <span>Login</span>
          <input
            placeholder="login"
            value={username}
            onChange={ev => setUsername(ev.target.value)}
          ></input>
          <input
            placeholder="password"
            type="password"
            value={password}
            onChange={ev => setPassword(ev.target.value)}
          ></input>
          <button type="submit">Envoyer</button>
        </div>
      </LoggedActionsCntr>
      {firstLogin ? (
        <FirstLoginModale
          onSetPassword={pw => setPasswordCall({ password: pw }).then(() => opt.onLoggedIn())}
        ></FirstLoginModale>
      ) : null}
    </>
  )
}

const FirstLoginModaleContent = styled.div`
  .question {
    padding-top: 1rem;
    font-size: 1.5rem;
    text-align: center;
  }
  .description {
    padding-top: 1rem;
    font-size: 1.1rem;
    text-align: left;
  }

  input {
    margin-top: 1rem;
    font-size: 1.2rem;
    width: 14rem;
  }

  button {
    font-size: 1.2rem;
    width: 10rem;
    margin-top: 0.5rem;

    padding: 0.5rem 1rem;
    cursor: pointer;
    background-color: #ede9e9;
    border-radius: 3px;
    border: solid 1px black;

    &:not(:disabled):hover {
      background-color: #c2c2c2;
    }
  }

  .form {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`

export function FirstLoginModale(opt: {
  onSetPassword: (password: string) => void
}) {
  const [password, setPassword] = useState('')
  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault()
    if (password.length > 0) opt.onSetPassword(password)
  }

  return (
    <Modale width="22rem" height="auto" onClose={() => {}} closeBtn={false}>
      <FirstLoginModaleContent>
        <form onSubmit={onSubmit}>
          <div className="question">Première connexion</div>
          <div className="form">
            <div className="description">Définissez votre mot de passe</div>
            <input
              placeholder="Mot de passe"
              type="password"
              value={password}
              onChange={ev => setPassword(ev.target.value)}
            />
            <button type="submit">Envoyer</button>
          </div>
        </form>
      </FirstLoginModaleContent>
    </Modale>
  )
}
