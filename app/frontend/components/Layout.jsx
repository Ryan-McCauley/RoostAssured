import React from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Layout({ children }) {
  const { user, logout } = useAuth()

  return (
    <>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", maxWidth: "64rem", margin: "0 auto", fontSize: "0.875rem" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, textDecoration: "none", color: "inherit" }}>
          <img src="/icon.svg" alt="" width="26" height="26" style={{ borderRadius: "0.35rem" }} />
          Roost Assured
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user ? (
            <>
              <Link to="/account">My account</Link>
              <button
                onClick={logout}
                style={{ background: "transparent", border: 0, padding: 0, textDecoration: "underline", cursor: "pointer", color: "inherit" }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link to="/signup" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </>
  )
}
