import { useState, useEffect, useRef } from "react"
import WelcomeModal from "./components/WelcomeModal.jsx"
import Sidebar from "./components/Sidebar.jsx"
import TopBar from "./components/TopBar.jsx"
import ScanProgress from "./components/ScanProgress.jsx"
import ResultsSummary from "./components/ResultsSummary.jsx"
import SenderCard from "./components/SenderCard.jsx"
import EmptyState from "./components/EmptyState.jsx"

const scanStages = [
  "Connecting to Gmail",
  "Fetching recent emails",
  "Reading through senders",
  "Spotting subscriptions",
  "Wrapping up"
]

export default function App() {
  const [isScanning, setIsScanning] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [authed, setAuthed] = useState(false)
  const [activeTab, setActiveTab] = useState("All")
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomeClosing, setWelcomeClosing] = useState(false)
  const [scanStage, setScanStage] = useState(0)
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 760)
  const [search, setSearch] = useState("")
  const [totalScanned, setTotalScanned] = useState(0)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 760)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    fetch("/auth/status")
      .then(r => r.json())
      .then(d => {
        setAuthed(d.authed)
        if (!d.authed) setShowWelcome(true)
      })
    // Strip the ?authed=true that Google's OAuth redirect leaves in the URL
    if (window.location.search) {
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  const scanAbort = useRef(null)
  const scanInterval = useRef(null)

  async function startScan() {
    setIsScanning(true)
    setError(null)
    setResults(null)
    setScanStage(0)
    const controller = new AbortController()
    scanAbort.current = controller
    // Advance through stages on a timer, holding at the last one until the request resolves
    scanInterval.current = setInterval(() => {
      setScanStage(s => (s < scanStages.length - 1 ? s + 1 : s))
    }, 1600)
    try {
      const response = await fetch("/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal
      })
      if (!response.ok) throw new Error("Server error " + response.status)
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setScanStage(scanStages.length)
      setResults(data.senders || [])
      setTotalScanned(data.totalScanned || 0)
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message)
    } finally {
      clearInterval(scanInterval.current)
      scanAbort.current = null
      setIsScanning(false)
    }
  }

  function cancelScan() {
    if (scanAbort.current) scanAbort.current.abort()
    if (scanInterval.current) clearInterval(scanInterval.current)
    setIsScanning(false)
    setScanStage(0)
  }

  function dismissWelcome() {
    setWelcomeClosing(true)
    setTimeout(() => {
      setShowWelcome(false)
      setWelcomeClosing(false)
    }, 1100)
  }

  async function signOut() {
    cancelScan()
    await fetch("/auth/logout", { method: "POST" })
    setAuthed(false)
    setResults(null)
    setError(null)
    setActiveTab("All")
    setShowWelcome(true)
  }

  const byCategory = activeTab === "All" ? (results || []) : (results || []).filter(s => s.category === activeTab)
  const q = search.trim().toLowerCase()
  const filtered = q ? byCategory.filter(s => (s.name || "").toLowerCase().includes(q)) : byCategory

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", minHeight: "100vh", fontFamily: "system-ui, sans-serif", background: "#f7f8f7" }}>

      {showWelcome && <WelcomeModal closing={welcomeClosing} onDismiss={dismissWelcome} isMobile={isMobile} />}

      <Sidebar authed={authed} results={results} activeTab={activeTab} onSelectTab={setActiveTab} isMobile={isMobile} />

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: isMobile ? "visible" : "hidden", minWidth: 0 }}>

        <TopBar
          title={activeTab === "All" ? "All senders" : activeTab}
          authed={authed}
          isScanning={isScanning}
          onScan={startScan}
          onSignOut={signOut}
          isMobile={isMobile}
        />

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "18px 16px" : "24px 32px" }}>

          {isScanning && <ScanProgress stages={scanStages} stage={scanStage} />}

          {error && <p style={{ color: "#5C3D2E", fontSize: 14, fontWeight: 500 }}>Uh oh! An error has occurred. Please try again.</p>}

          {results && (
            <div>
              <ResultsSummary results={results} totalScanned={totalScanned} search={search} onSearch={setSearch} isMobile={isMobile} />

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filtered.length === 0 && (
                  <div style={{ textAlign: "center", color: "#999", fontSize: 14, padding: "30px 0" }}>No senders match “{search}”.</div>
                )}
                {filtered.map((s, i) => <SenderCard key={i} sender={s} isMobile={isMobile} />)}
              </div>
            </div>
          )}

          {!results && !isScanning && <EmptyState />}
        </div>
      </div>
    </div>
  )
}
