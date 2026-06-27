import { useState, useEffect } from "react"

export default function App() {
  const [isScanning, setIsScanning] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [loadingMsg, setLoadingMsg] = useState("")
  const [authed, setAuthed] = useState(false)
  const [activeTab, setActiveTab] = useState("All")
  const [showWelcome, setShowWelcome] = useState(false)

  const loadingMsgs = [
    "Connecting to Gmail...",
    "Fetching your recent emails...",
    "Claude is reading through senders...",
    "Spotting subscriptions...",
    "Almost done..."
  ]

  useEffect(() => {
    fetch("/auth/status")
      .then(r => r.json())
      .then(d => {
        setAuthed(d.authed)
        if (!d.authed) setShowWelcome(true)
      })
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
      const response = await fetch("/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      if (!response.ok) throw new Error("Server error " + response.status)
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setResults(data.senders || [])
    } catch (err) {
      setError(err.message)
    } finally {
      clearInterval(interval)
      setIsScanning(false)
    }
  }

  async function signOut() {
    await fetch("/auth/logout", { method: "POST" })
    setAuthed(false)
    setResults(null)
    setError(null)
    window.location.href = "/auth/login"
  }

  function initials(name) {
    return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("")
  }

  const categoryColors = {
    "Newsletters":        { bg: "#E6F1FB", color: "#0C447C" },
    "Marketing & promos": { bg: "#FAEEDA", color: "#633806" },
    "Social":             { bg: "#E1F5EE", color: "#085041" },
  }

  const tabs = ["All", "Newsletters", "Marketing & promos", "Social"]
  const filtered = activeTab === "All" ? (results || []) : (results || []).filter(s => s.category === activeTab)

  const sidebarItems = [
    { label: "All senders", key: "All" },
    { label: "Newsletters", key: "Newsletters" },
    { label: "Marketing & promos", key: "Marketing & promos" },
    { label: "Social", key: "Social" },
  ]

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "system-ui, sans-serif", background: "#f7f8f7" }}>

      {/* Welcome modal */}
      {showWelcome && (
        <div
          onClick={() => setShowWelcome(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(10, 61, 46, 0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 18, maxWidth: 640, width: "100%", padding: "32px 34px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
          >
            <img src="/favicon.svg" alt="" width="46" height="46" style={{ display: "block", marginBottom: 10 }} />
            <h2 style={{ fontSize: 23, fontWeight: 700, color: "#0a3d2e", margin: "0 0 6px" }}>Welcome to the Inbox Cleanup Agent</h2>
            <p style={{ fontSize: 14, color: "#5C3D2E", margin: "0 0 22px", lineHeight: 1.5, whiteSpace: "nowrap" }}>
              Your inbox is a mess. We both know it. Let's fix that in three painless steps:
            </p>

            {[
              { t: "Connect your Google account", d: "" },
              { t: "Scan your inbox", d: "" },
              { t: "Hit \"Unsubscribe\" to investigate", d: "We'll whisk you to that sender's latest email so YOU can decide if it deserves the boot. No regrets, no accidental goodbyes." },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 13, marginBottom: 16, alignItems: "flex-start", textAlign: "left" }}>
                <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: "#0a3d2e", color: "#5DCAA5", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "#111" }}>{step.t}</div>
                  {step.d && <div style={{ fontSize: 13, color: "#5C3D2E", lineHeight: 1.45 }}>{step.d}</div>}
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowWelcome(false)}
              style={{ width: "100%", marginTop: 8, fontSize: 15, fontWeight: 600, padding: "13px", borderRadius: 10, border: "none", background: "#5C3D2E", color: "#fff", cursor: "pointer" }}
            >
              Got it!
            </button>
            <div style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "#5C3D2E", marginTop: 14 }}>Tool created by Aishi Agarwal</div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: 200, background: "#0a3d2e", display: "flex", flexDirection: "column", padding: "28px 16px", flexShrink: 0 }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: "1.2", marginBottom: 8 }}>Inbox<br/>Cleanup<br/>Agent</div>
        <div style={{ fontSize: 11, color: "#5DCAA5", marginBottom: 32, display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: authed ? "#5DCAA5" : "#888", display: "inline-block" }}></span>
          {authed ? "Gmail connected" : "Not connected"}
        </div>

        <div style={{ fontSize: 10, color: "#5DCAA5", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 10 }}>Views</div>
        {sidebarItems.map(item => {
          const count = results ? (item.key === "All" ? results.length : results.filter(s => s.category === item.key).length) : null
          const isActive = activeTab === item.key
          return (
            <div
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              style={{ fontSize: 13, color: isActive ? "#fff" : "#9FE1CB", padding: "9px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: isActive ? "#1D9E75" : "transparent", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: isActive ? 500 : 400 }}
            >
              <span>{item.label}</span>
              {count !== null && <span style={{ fontSize: 11, background: isActive ? "#0F6E56" : "#0a3d2e", color: isActive ? "#9FE1CB" : "#5DCAA5", borderRadius: 99, padding: "1px 7px" }}>{count}</span>}
            </div>
          )
        })}

        <div style={{ marginTop: "auto", fontSize: 11, color: "#5DCAA5", paddingTop: 16, borderTop: "1px solid #1D9E75" }}>
          {results ? `${results.length} senders found` : "No scan yet"}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>
            {activeTab === "All" ? "All senders" : activeTab}
          </div>
          {authed ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={signOut}
                style={{ fontSize: 14, padding: "12px 20px", borderRadius: 8, border: "1px solid #C4956A", background: "#fff", color: "#5C3D2E", fontWeight: 600, cursor: "pointer" }}
              >
                Sign out
              </button>
              <button
                onClick={startScan}
                disabled={isScanning}
                style={{ fontSize: 16, padding: "12px 28px", borderRadius: 8, border: "none", background: isScanning ? "#ccc" : "#5C3D2E", color: "#fff", fontWeight: 600, cursor: isScanning ? "default" : "pointer", display: "flex", alignItems: "center", gap: 5 }}
              >
                {isScanning ? "Scanning..." : "↻  Scan Inbox"}
              </button>
            </div>
          ) : (
            <a href="/auth/login" style={{ textDecoration: "none" }}>
              <button style={{ fontSize: 14, padding: "12px 28px", borderRadius: 8, border: "none", background: "#5C3D2E", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                Sign in with Google
              </button>
            </a>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>

          {isScanning && (
            <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: "14px 18px", marginBottom: 16, fontSize: 13, color: "#555" }}>
              {loadingMsg}
            </div>
          )}
          {error && <p style={{ color: "#5C3D2E", fontSize: 13 }}>Something went wrong: {error}</p>}

          {results && (
            <div>
              {/* Stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { num: results.length, label: "Senders found", bg: "#fff", border: "#5DCAA5", numColor: "#0F6E56" },
                  { num: results.filter(s => s.recommendation === "unsubscribe").length, label: "To unsubscribe", bg: "#F5EBE0", border: "#C4956A", numColor: "#5C3D2E" },
                  { num: results.reduce((acc, s) => acc + (s.emailCount || 0), 0), label: "Total emails scanned", bg: "#fff", border: "#e8e8e8", numColor: "#111" }
                ].map(({ num, label, bg, border, numColor }) => (
                  <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "16px 18px" }}>
                    <div style={{ fontSize: 38, fontWeight: 700, color: numColor }}>{num}</div>
                    <div style={{ fontSize: 13, color: "#5C3D2E", marginTop: 3 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Sender cards */}
              <p style={{ fontSize: 11, color: "#5C3D2E", marginBottom: 12 }}>These are Claude's suggestions — nothing changes until you act.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map((s, i) => {
                  const cat = categoryColors[s.category] || { bg: "#f0f0f0", color: "#555" }
                  const isUnsub = s.recommendation === "unsubscribe"
                  return (
                    <div key={i} style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 10, padding: "16px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: cat.color, flexShrink: 0, marginTop: 2 }}>
                        {initials(s.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, fontSize: 15, color: "#111" }}>{s.name}</span>
                          <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 99, background: cat.bg, color: cat.color, fontWeight: 500 }}>{s.category}</span>
                          <span
                            onClick={() => {
                              if (isUnsub && s.gmailUrl) window.open(s.gmailUrl, "_blank")
                            }}
                            style={{ fontSize: 11, padding: "2px 9px", borderRadius: 99, background: isUnsub ? "#167458" : "#EAF3DE", color: isUnsub ? "#fff" : "#27500A", fontWeight: 600, cursor: isUnsub ? "pointer" : "default" }}
                          >
                            {isUnsub ? "✉ Open in Gmail" : "✓ Keep"}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: "#5C3D2E" }}>{s.email} · {s.emailCount} email{s.emailCount !== 1 ? "s" : ""} · {s.reason}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!results && !isScanning && (
            <div style={{ textAlign: "center", marginTop: 80, color: "#7a5c4e" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#555", marginBottom: 6 }}>No scan yet</div>
              <div style={{ fontSize: 13 }}>Hit "Scan inbox" to find subscriptions you can cut.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}