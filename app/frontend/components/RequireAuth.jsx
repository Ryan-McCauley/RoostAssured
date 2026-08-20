import React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

// The server is the authority -- every one of these routes 401s without a session -- so this is a
// UX guard, not a security boundary. Without it a signed-out visitor lands on Account or
// JobRequests, watches it render, and then sees it fail.
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p style={{ padding: "2rem" }}>Loading…</p>
  // `state` lets the login page send them back where they were headed.
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return children
}
