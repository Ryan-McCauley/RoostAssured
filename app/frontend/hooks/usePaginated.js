import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "../lib/api"

// Admin indexes are paginated server-side, so each of them needs the same three pieces of state:
// the current page, the rows for it, and the meta the Pagination control renders from.
export function usePaginated(path, { params = {} } = {}) {
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const filterKey = new URLSearchParams(params).toString()
  const previousFilterKey = useRef(filterKey)

  // Changing a filter changes which rows exist, so the old page number is meaningless -- without
  // this you can be sitting on page 5 of a result that now has one page, and see nothing.
  useEffect(() => {
    if (previousFilterKey.current !== filterKey) {
      previousFilterKey.current = filterKey
      setPage(1)
    }
  }, [filterKey])

  const query = new URLSearchParams({ ...params, page: String(page) }).toString()

  const load = useCallback(() => {
    setError(null)
    api
      .get(`${path}?${query}`)
      .then(setData)
      .catch((e) => setError(e.message))
  }, [path, query])

  useEffect(() => { load() }, [load])

  return { data, meta: data?.meta, page, setPage, reload: load, error }
}
