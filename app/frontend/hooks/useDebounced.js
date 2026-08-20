import { useEffect, useState } from "react"

// Keeps a server-side search from firing a request per keystroke.
export function useDebounced(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
