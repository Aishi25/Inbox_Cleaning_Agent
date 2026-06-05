import { useState, useEffect } from "react"

export default function App() {
  const [isScanning, setIsScanning] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [loadingMsg, setLoadingMsg] = useState("")
  const [authed, setAuthed] = useState(false)
  const [activeTab, setActiveTab] = useState("All")

  const loadingMsgs = [
    "Connecting to Gmail...",
    "Fetching your recent emails...",
    "Claude is reading through senders...",
    "Spotting newsletters and subscriptions...",
    "Almost done..."
  ]

  useEffect(() => {
    fetch("http://localhost:3001/auth/status")
      .then(r => r.json())
      .then(d => setAuthed(d.authed))
  }, [])

  async function startScan() {
    setIsScanning(true)
    setError(null)
    setResults(null)
    let msgIdx = 0
    setLoadingMsg(loadingMsgs[0])
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMsgs.length
      setLoadingMsg(loadingMsgs[msgIdx])
    }, 2500)
    try {
      const response = await fetch("http://localhost:3001/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      if (!response.ok) throw new Error("Server error " + response.status)
      const data = await response.json()
      const textBlock = data.content.find(b => b.type === "text")
      if (!textBlock) throw new Error("No response from Claude")
      const clean = textBlock.text.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(clean)
      setResults(parsed.senders || [])
    } catch (err) {
      setError(err.message)
    } finally {
      clearInterval(interval)
      setIsScanning(false)
    }
  }

  function initials(name) {
    return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("")
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 4 }}>Inbox cleanup agent</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Find subscriptions and newsletters you can unsubscribe from.</p>

      {!authed ? (
        <div>
          <p style={{ color: "#888", marginBottom: 16, fontSize: 14 }}>First, connect your Gmail account.</p>
          <a href="http://localhost:3001/auth/login">
            <button style={{ padding: "10px 24px", fontSize: 15, cursor: "pointer" }}>
              Sign in with Google
            </button>
          </a>
        </div>
      ) : (
        <div>
          <p style={{ color: "#2e7d32", fontSize: 13, marginBottom: 16 }}>Gmail connected!</p>
          <button onClick={startScan} disabled={isScanning} style={{ padding: "10px 24px", fontSize: 15, cursor: "pointer" }}>
            {isScanning ? "Scanning..." : "Scan my inbox"}
          </button>
        </div>
      )}

      {isScanning && <p style={{ color: "#666", marginTop: 16 }}>{loadingMsg}</p>}
      {error && <p style={{ color: "red", marginTop: 16 }}>Something went wrong: {error}</p>}

      {results && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            <div style={{ background: "#f5f5f5", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 500 }}>{results.length}</div>
              <div style={{ fontSize: 12, color: "#666" }}>Senders found</div>
            </div>
            <div style={{ background: "#f5f5f5", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 500 }}>{results.filter(s => s.recommendation === "unsubscribe").length}</div>
              <div style={{ fontSize: 12, color: "#666" }}>Suggested to unsubscribe</div>
            </div>
            <div style={{ background: "#f5f5f5", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 500 }}>{results.reduce((acc, s) => acc + (s.emailCount || 0), 0)}</div>
              <div style={{ fontSize: 12, color: "#666" }}>Total emails</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>These are Claude's suggestions - you decide what to do.</p>
          {(() => {
            const tabs = ["All", "Newsletters", "Marketing & promos", "Product updates", "Social", "All else"]
            const filtered = activeTab === "All" ? results : results.filter(s => s.category === activeTab)
            return (
              <>
                <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #eee" }}>
                  {tabs.map(tab => {
                    const count = tab === "All" ? results.length : results.filter(s => s.category === tab).length
                    return (
                      <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "6px 12px", fontSize: 12, cursor: "pointer", border: "none", borderBottom: activeTab === tab ? "2px solid #000" : "2px solid transparent", background: "none", fontWeight: activeTab === tab ? 500 : 400, color: activeTab === tab ? "#000" : "#888" }}>
                        {tab} ({count})
                      </button>
                    )
                  })}
                </div>
                {filtered.map((s, i) => (
            <div key={i} style={{ border: "1px solid #eee", borderRadius: 12, padding: "12px 16px", marginBottom: 8, display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, color: "#1a73e8", flexShrink: 0 }}>
                {initials(s.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{s.name}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#f0f0f0", color: "#555" }}>{s.category}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: s.recommendation === "unsubscribe" ? "#fce8e6" : "#e6f4ea", color: s.recommendation === "unsubscribe" ? "#c5221f" : "#137333", fontWeight: 500 }}>
                    {s.recommendation === "unsubscribe" ? "Unsubscribe" : "Keep"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{s.email} · {s.emailCount} email{s.emailCount !== 1 ? "s" : ""}</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>{s.reason}</div>
              </div>
            </div>
          ))}
            </>
          )
        })()}
        </div>
      )}
    </div>
  )
}