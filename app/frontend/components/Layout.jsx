import React from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"

const navIconProps = {
  width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round",
}

const SearchIcon = () => (
  <svg {...navIconProps}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
)

const EGG_PATH = "M0,-6.2 C-3.6,-6.2 -4.6,-1.5 -4.4,1.3 C-4.2,4.6 -2.3,6.2 0,6.2 C2.3,6.2 4.2,4.6 4.4,1.3 C4.6,-1.5 3.6,-6.2 0,-6.2 Z"

const EggIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 24" fill="currentColor" stroke="none">
    <path d={EGG_PATH} opacity="0.45" transform="translate(9.5,10) rotate(-20) scale(0.62)" />
    <path d={EGG_PATH} opacity="0.45" transform="translate(18.5,10) rotate(20) scale(0.62)" />
    <path d={EGG_PATH} transform="translate(14,15) scale(0.84)" />
  </svg>
)

const HelpIcon = () => (
  <svg {...navIconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.75c0 1.75-2.4 2-2.4 3.5" />
    <path d="M12 17.5h.01" />
  </svg>
)

const SunIcon = () => (
  <svg {...navIconProps}>
    <circle cx="12" cy="12" r="4.25" />
    <path d="M12 2.5v2.25M12 19.25v2.25M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.25M19.25 12h2.25M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
  </svg>
)

const MoonIcon = () => (
  <svg {...navIconProps}>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
  </svg>
)

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", width: "2rem", height: "2rem",
        background: "transparent", border: "1px solid var(--border)", borderRadius: "999px", color: "inherit", cursor: "pointer",
      }}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function NavLink({ href, to, icon, children }) {
  const style = {
    display: "flex", alignItems: "center", gap: "0.4rem", color: "inherit", textDecoration: "none", fontWeight: 600,
  }
  if (to) {
    return <Link to={to} style={style}>{icon}{children}</Link>
  }
  return <a href={href} style={style}>{icon}{children}</a>
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()

  return (
    <>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", padding: "1rem 1.25rem", maxWidth: "64rem", margin: "0 auto", fontSize: "0.875rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.75rem", flexWrap: "wrap" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, textDecoration: "none", color: "inherit" }}>
            <img src="/icon.svg" alt="" width="26" height="26" style={{ borderRadius: "0.35rem" }} />
            Roost Assured
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
            <NavLink href="/" icon={<SearchIcon />}>Search Sitters</NavLink>
            <NavLink to="/become-a-sitter" icon={<EggIcon />}>Become a Sitter</NavLink>
          </nav>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
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
              <Link to="/signup" className="btn btn-primary">Sign up</Link>
              <Link to="/login">Sign in</Link>
            </>
          )}
          <NavLink href="/#faq" icon={<HelpIcon />}>Help</NavLink>
          <ThemeToggle />
        </nav>
      </header>
      <main>{children}</main>
      <footer style={{ maxWidth: "64rem", margin: "3rem auto 0", padding: "1.5rem 1.25rem", borderTop: "1px solid var(--border)", display: "flex", gap: "1.25rem", flexWrap: "wrap", justifyContent: "center", textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
        <Link to="/terms" style={{ color: "inherit" }}>Terms of Service</Link>
        <Link to="/privacy" style={{ color: "inherit" }}>Privacy Policy</Link>
        <Link to="/independent-contractor-disclosure" style={{ color: "inherit" }}>Independent Contractor Disclosure</Link>
        <Link to="/background-check-disclosure" style={{ color: "inherit" }}>Background Check Disclosure</Link>
      </footer>
    </>
  )
}
