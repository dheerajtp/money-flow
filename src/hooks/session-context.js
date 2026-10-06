import { createContext } from 'react'

export const SessionContext = createContext({ session: null, loading: true, recovery: false })
