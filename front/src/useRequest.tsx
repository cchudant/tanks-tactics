import { createContext, useContext, useEffect, useState } from 'react'

export const RequestContext = createContext<{ apiUrl: string } | null>(null)

export const RequestProvider: React.FC<{
  apiUrl: string
}> = ({ apiUrl, children }) => {
  if (typeof window === 'undefined') {
    return <>{children}</>
  }

  return (
    <RequestContext.Provider value={{ apiUrl }}>
      {children}
    </RequestContext.Provider>
  )
}

export class ApiError extends Error {
  constructor(public res: Response, message: string) {
    super(message)
  }
}

async function handleError(res: Response) {
  if (!res.ok) {
    let message = res.statusText
    try {
      const json = (await res.json())
      const msg = json.message
      if (typeof msg === 'string') message = msg
      if (Array.isArray(msg) && typeof msg[0] === 'string') message = msg[0]
    } catch (e) {}

    throw new ApiError(res, message)
  }
}

export function useRequest<T>(
  url: string,
  options?: RequestInit
): { data: T | null; setData: (d: T | null) => void; refetch: () => void } {
  const [data, setData] = useState<T | null>(null)
  const ctx = useContext(RequestContext)
  if (!ctx) throw new Error('FetchContext not initialized')

  const refetch = async () => {
    const res = await fetch(ctx.apiUrl + url, {
      credentials: 'include',
      ...options,
    })
    await handleError(res)

    const json =
      res.headers.get('content-length') == '0' ? {} : await res.json()
    setData(json)
  }

  useEffect(() => {
    refetch()
  }, [])
  return { data, setData, refetch }
}

export function usePost<T = any>(
  url: string,
  options?: RequestInit
): {
  call: (body?: object) => Promise<T>
  result: T | null
  returned: boolean
} {
  const ctx = useContext(RequestContext)
  if (!ctx) throw new Error('FetchContext not initialized')

  const [data, setData] = useState<T | null>(null)
  const [returned, setReturned] = useState<boolean>(false)

  return {
    call: async (body?: object) => {
      setReturned(false)
      const res = await fetch(ctx.apiUrl + url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
        body: body && JSON.stringify(body),
        credentials: 'include',
        ...options,
      })
      await handleError(res)

      const json =
        res.headers.get('content-length') == '0' ? {} : await res.json()

      setData(json)
      setReturned(true)
      return json
    },
    result: data,
    returned,
  }
}
