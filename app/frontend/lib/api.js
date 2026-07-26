function csrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]')
  return meta ? meta.getAttribute("content") : null
}

const ADMIN_AUTH_KEY = "roostAssured.adminAuth"

export function getAdminAuth() {
  return sessionStorage.getItem(ADMIN_AUTH_KEY)
}

export function setAdminAuth(username, password) {
  sessionStorage.setItem(ADMIN_AUTH_KEY, btoa(`${username}:${password}`))
}

export function clearAdminAuth() {
  sessionStorage.removeItem(ADMIN_AUTH_KEY)
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { Accept: "application/json" }
  const token = csrfToken()
  if (token) headers["X-CSRF-Token"] = token
  const isFormData = body instanceof FormData
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json"
  if (path.startsWith("/admin")) {
    const adminAuth = getAdminAuth()
    if (adminAuth) headers["Authorization"] = `Basic ${adminAuth}`
  }

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  })

  let data = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    if (response.status === 401 && path.startsWith("/admin")) {
      clearAdminAuth()
      window.dispatchEvent(new Event("admin-auth-required"))
    }
    const error = new Error((data && data.errors && data.errors.join(", ")) || "Request failed")
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
}
