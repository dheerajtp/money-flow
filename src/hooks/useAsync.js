import { useCallback, useEffect, useRef, useState } from 'react'

// Runs an async function when `deps` change (and when reload() is called).
// Returns { data, error, loading, reload }. Stale results are ignored.
export default function useAsync(fn, deps = []) {
  const fnRef = useRef(fn)
  const [tick, setTick] = useState(0)
  const [result, setResult] = useState({ key: null, data: undefined, error: null })
  const key = [...deps, tick].join('|')

  useEffect(() => {
    fnRef.current = fn
  })

  useEffect(() => {
    let cancelled = false
    fnRef.current().then(
      (data) => {
        if (!cancelled) setResult({ key, data, error: null })
      },
      (error) => {
        if (!cancelled) setResult({ key, data: undefined, error })
      },
    )
    return () => {
      cancelled = true
    }
  }, [key])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data: result.data, error: result.error, loading: result.key !== key, reload }
}
