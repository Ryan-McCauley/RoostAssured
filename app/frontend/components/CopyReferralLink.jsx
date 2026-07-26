import React, { useState } from "react"

export default function CopyReferralLink({ code }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/?ref=${code}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <input readOnly value={url} style={{ flex: 1 }} onFocus={(e) => e.target.select()} />
      <button type="button" className="btn btn-outline" onClick={copy}>
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  )
}
