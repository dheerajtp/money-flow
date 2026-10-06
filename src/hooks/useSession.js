import { useContext } from 'react'
import { SessionContext } from './session-context.js'

export default function useSession() {
  return useContext(SessionContext)
}
