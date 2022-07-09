import { createContext, useContext, useEffect, useRef, useState } from 'react'

import io, { ManagerOptions, Socket, SocketOptions } from 'socket.io-client'

export const SocketIOContext = createContext<Socket | null>(null)

export interface ISocketIOProviderProps {
  url: string
  opts?: Partial<ManagerOptions & SocketOptions>
}

export const SocketIOProvider: React.FC<ISocketIOProviderProps> = ({
  url,
  opts,
  children,
}) => {
  const socketRef = useRef<Socket>()

  if (typeof window === 'undefined') {
    return <>{children}</>
  }

  if (!socketRef.current) {
    socketRef.current = io(url, opts)
  }

  return (
    <SocketIOContext.Provider value={socketRef.current}>
      {children}
    </SocketIOContext.Provider>
  )
}

export const useSocket = (
  eventKey?: string,
  callback: (...args: any) => void = () => {}
) => {
  const socket = useContext(SocketIOContext)
  if (!socket) throw new Error('SocketIOContext not initialized')

  const socketHandlerRef = useRef(callback)

  useEffect(() => {
    if (eventKey) {
      socket.on(eventKey, socketHandlerRef.current)
    }

    return () => {
      if (eventKey) {
        socket.off(eventKey, socketHandlerRef.current)
      }
    }
  }, [eventKey])

  return socket
}

export function useLastSocketMessage<T>(eventKey: string, defaultValue: T) {
  const socket = useContext(SocketIOContext)
  const [data, setData] = useState<T>(defaultValue)
  if (!socket) throw new Error('SocketIOContext not initialized')

  useEffect(() => {
    if (eventKey) {
      socket.on(eventKey, setData)
    }

    return () => {
      if (eventKey) {
        socket.off(eventKey, setData)
      }
    }
  }, [eventKey])

  return { data, setData }
}
