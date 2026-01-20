import { type DependencyList, useEffect } from "react"

export const useDebouncedEffect = (effect: () => void, deps: DependencyList, delay: number) => {
  useEffect(() => {
    const handle = window.setTimeout(() => {
      effect()
    }, delay)

    return () => {
      window.clearTimeout(handle)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
