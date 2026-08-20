import { useEffect } from "react"

function setMeta(name, content) {
  if (!content) return
  let tag = document.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement("meta")
    tag.setAttribute("name", name)
    document.head.appendChild(tag)
  }
  tag.setAttribute("content", content)
}

export default function useSeo({ title, description } = {}) {
  useEffect(() => {
    const previousTitle = document.title
    const previousDescription = document.querySelector('meta[name="description"]')?.getAttribute("content")

    if (title) document.title = title
    if (description) setMeta("description", description)

    return () => {
      document.title = previousTitle
      if (previousDescription) setMeta("description", previousDescription)
    }
  }, [title, description])
}
