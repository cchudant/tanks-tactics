import { useState, FormEvent } from 'react'
import styled from 'styled-components'

const ModaleCtnr = styled.div<{
  width: string
  height: string
  closeBtn: boolean
}>`
  position: fixed;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  .back {
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
  }
  .front {
    position: fixed;
    width: ${opt => opt.width};
    height: ${opt => opt.height};
    background-color: white;
    border-radius: 10px;
    .content {
      padding: 1rem;
    }
  }

  .closeBtn {
    position: absolute;
    display: ${opt => (opt.closeBtn ? null : 'none')};
    top: 1rem;
    right: 1rem;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    cursor: pointer;
    &:before,
    &:after {
      content: ' ';
      position: absolute;
      width: 100%;
      height: 2px;
      top: 50%;
      background-color: #444;
    }

    &:before {
      rotate: 45deg;
    }
    &:after {
      rotate: -45deg;
    }
  }
`

export function Modale(opt: {
  width: string
  height: string
  children: JSX.Element[] | JSX.Element
  closeBtn: boolean
  onClose?: () => void
}) {
  return (
    <ModaleCtnr width={opt.width} height={opt.height} closeBtn={opt.closeBtn}>
      <div className="back" onClick={opt.onClose}></div>
      <div className="front">
        <div className="closeBtn" onClick={opt.onClose} />
        <div className="content">{opt.children}</div>
      </div>
    </ModaleCtnr>
  )
}

const CommonModaleCtnr = styled.div`
  .modale-title {
    padding-top: 1rem;
    font-size: 1.5rem;
    text-align: center;
  }
  .description {
    padding: 0.2rem;
    font-size: 1.2rem;
    text-align: center;
  }

  .buttons {
    padding: 1rem;
    padding-top: 2rem;
    display: flex;
    button {
      min-width: 8rem;
      font-size: 1.2rem;

      padding: 0.5rem 1rem;
      cursor: pointer;
      background-color: #ede9e9;
      border-radius: 3px;
      border: solid 1px black;

      &:not(:disabled):hover {
        background-color: #c2c2c2;
      }

      &:last-child {
        margin-left: auto;
      }
    }
  }

  .fields {
    input {
      margin: 0;
      width: 100%;
    }
  }
`

export function ConfirmModale(opt: {
  question: string
  description?: string | JSX.Element
  onConfirm: () => Promise<void> | void
  onClose: () => void
}) {
  const [error, setError] = useState<string | undefined>()
  const confirm = () =>
    Promise.resolve(opt.onConfirm()).catch(err => {
      setError(err.message)
      console.error(err)
    })

  return (
    <Modale width="22rem" height="auto" onClose={opt.onClose} closeBtn={true}>
      <CommonModaleCtnr>
        <div className="title">{opt.question}</div>
        <div className="description">{opt.description}</div>
        <div className="error">{error}</div>
        <div className="buttons">
          <button onClick={opt.onClose}>Annuler</button>
          <button onClick={confirm}>Confirmer</button>
        </div>
      </CommonModaleCtnr>
    </Modale>
  )
}

export function InfoModale(opt: {
  title: string
  description?: string | JSX.Element
  onClose?: () => void
}) {
  return (
    <Modale width="22rem" height="auto" onClose={opt.onClose} closeBtn={true}>
      <CommonModaleCtnr>
        <div className="modale-title">{opt.title}</div>
        <div className="description">{opt.description}</div>
        <div className="buttons">
          <button onClick={opt.onClose}>Fermer</button>
        </div>
      </CommonModaleCtnr>
    </Modale>
  )
}

export interface FormModaleField {
  name: string
  placeholder: string
}

export function FormModale(opt: {
  title: string
  description?: string | JSX.Element
  fields: FormModaleField[]
  onSubmit: (formData: Record<string, any>) => Promise<void> | void
  onClose?: () => void
}) {
  const [error, setError] = useState<string | undefined>()
  const [formData, setFormData] = useState<Record<string, any>>({})

  const submit = (ev: FormEvent) => {
    ev.preventDefault()

    Promise.resolve(opt.onSubmit(formData)).catch(err => {
      setError(err.message)
      console.error(err)
    })
  }

  return (
    <Modale width="22rem" height="auto" onClose={opt.onClose} closeBtn={true}>
      <CommonModaleCtnr as="form" onSubmit={submit}>
        <div className="modale-title">{opt.title}</div>
        <div className="description">{opt.description}</div>
        <div className="fields">
          {opt.fields.map(field => (
            <input
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={ev =>
                setFormData({ ...formData, [field.name]: ev.target.value })
              }
              key={field.name}
            ></input>
          ))}
        </div>
        <div className="error">{error}</div>
        <div className="buttons">
          <button onClick={opt.onClose}>Annuler</button>
          <button type="submit">Confirmer</button>
        </div>
      </CommonModaleCtnr>
    </Modale>
  )
}
