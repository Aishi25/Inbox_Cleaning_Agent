// main react component: holds all the app's state, talks to the server, and lays out the page
// flow: page opens -> check if signed in -> user clicks scan -> show progress -> show sender cards
import { useState, useEffect, useRef } from "react"
import WelcomeModal from "./components/WelcomeModal.jsx"
import Sidebar from "./components/Sidebar.jsx"
import TopBar from "./components/TopBar.jsx"
import ScanProgress from "./components/ScanProgress.jsx"
import ResultsSummary from "./components/ResultsSummary.jsx"
import SenderCard from "./components/SenderCard.jsx"
import EmptyState from "./components/EmptyState.jsx"

// labels for the progress bar while scanning
// these move on a timer, they aren't tied to what the server is actually doing
const scanStages = [
  "Connecting to Gmail",
  "Fetching recent emails",
  "Reading through senders",
  "Spotting subscriptions",
  "Wrapping up"
]

export default function App() {
  // state: everything the page needs to remember. when any of these change, react re-draws the page
  const [isScanning, setIsScanning] = useState(false) // true while waiting on /scan
  const [results, setResults] = useState(null) // list of senders from the server, null = no scan yet
  const [error, setError] = useState(null) // error message if the scan failed
  const [authed, setAuthed] = useState(false) // signed in with google or not
  const [activeTab, setActiveTab] = useState("All") // which sidebar category is selected
  const [showWelcome, setShowWelcome] = useState(false) // welcome popup open or not
  const [welcomeClosing, setWelcomeClosing] = useState(false) // true during the popup's closing animation
  const [scanStage, setScanStage] = useState(0) // which progress label is showing
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 760) // small screen layout
  const [search, setSearch] = useState("") // text in the search bar
  const [totalScanned, setTotalScanned] = useState(0) // real number of emails the server looked at

  // switch to the mobile layout when the window gets narrow
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 760)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize) // cleanup when the component goes away
  }, [])

  // when the page first opens: check if the user is already signed in
  // new visitors see the welcome popup, signed in users go straight to the app
  useEffect(() => {
    fetch("/auth/status")
      .then(r => r.json())
      .then(d => {
        setAuthed(d.authed)
        if (!d.authed) setShowWelcome(true)
      })
    // remove the ?authed=true google's redirect leaves in the url
    if (window.location.search) {
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  // useRef keeps these between re-draws without causing one
  const scanAbort = useRef(null) // lets us cancel the /scan request
  const scanInterval = useRef(null) // the progress bar timer

  // startScan: runs when you click "scan inbox"
  // the user sees the progress bar, the server does gmail + claude, then the sender cards show up
  async function startScan() {
    // reset everything from the last scan
    setIsScanning(true)
    setError(null)
    setResults(null)
    setScanStage(0)
    const controller = new AbortController()
    scanAbort.current = controller

    // move the progress label forward every 1.6s, stopping at the last one until the server replies
    scanInterval.current = setInterval(() => {
      setScanStage(s => (s < scanStages.length - 1 ? s + 1 : s))
    }, 1600)

    // ask the server to scan, then save what it sends back
    try {
      const response = await fetch("/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal // connects the request to the abort controller
      })
      if (!response.ok) throw new Error("Server error " + response.status)
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      // success: fill the bar and save what the server sent back
      setScanStage(scanStages.length)
      setResults(data.senders || [])
      setTotalScanned(data.totalScanned || 0)
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message) // cancelling on purpose isn't an error
    } finally {
      // runs whether it worked or not
      clearInterval(scanInterval.current)
      scanAbort.current = null
      setIsScanning(false)
    }
  }

  // cancelScan: stops a scan that's still running (used when signing out mid scan)
  function cancelScan() {
    if (scanAbort.current) scanAbort.current.abort()
    if (scanInterval.current) clearInterval(scanInterval.current)
    setIsScanning(false)
    setScanStage(0)
  }

  // dismissWelcome: plays the closing animation, then hides the popup after 1.1s
  function dismissWelcome() {
    setWelcomeClosing(true)
    setTimeout(() => {
      setShowWelcome(false)
      setWelcomeClosing(false)
    }, 1100)
  }

  // signOut: cancel any scan, tell the server to forget the tokens, reset the page
  // the user ends up back at the welcome popup like a fresh visit
  async function signOut() {
    cancelScan()
    await fetch("/auth/logout", { method: "POST" })
    setAuthed(false)
    setResults(null)
    setError(null)
    setActiveTab("All")
    setShowWelcome(true)
  }

  // what actually shows in the list: filter by sidebar tab, then by search text
  // so clicking "newsletters" or typing a name narrows the list right away
  const byCategory = activeTab === "All" ? (results || []) : (results || []).filter(s => s.category === activeTab)
  const q = search.trim().toLowerCase()
  const filtered = q ? byCategory.filter(s => (s.name || "").toLowerCase().includes(q)) : byCategory

  // page layout: sidebar on the left, top bar + content on the right
  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", minHeight: "100vh", fontFamily: "system-ui, sans-serif", background: "#f7f8f7" }}>

      {/* welcome popup for new visitors */}
      {showWelcome && <WelcomeModal closing={welcomeClosing} onDismiss={dismissWelcome} isMobile={isMobile} />}

      {/* left: app name, connection status, category tabs with counts */}
      <Sidebar authed={authed} results={results} activeTab={activeTab} onSelectTab={setActiveTab} isMobile={isMobile} />

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: isMobile ? "visible" : "hidden", minWidth: 0 }}>

        {/* top: page title + sign in / sign out / scan buttons */}
        <TopBar
          title={activeTab === "All" ? "All senders" : activeTab}
          authed={authed}
          isScanning={isScanning}
          onScan={startScan}
          onSignOut={signOut}
          isMobile={isMobile}
        />

        {/* Content: only one of these shows depending on the state */}
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "18px 16px" : "24px 32px" }}>

          {/* while scanning: progress bar */}
          {isScanning && <ScanProgress stages={scanStages} stage={scanStage} />}

          {/* if the scan failed: friendly error message */}
          {error && <p style={{ color: "#5C3D2E", fontSize: 14, fontWeight: 500 }}>Uh oh! An error has occurred. Please try again.</p>}

          {/* after a scan: stat chips + search, then one card per sender */}
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

          {/* before any scan: empty screen telling the user to sign in and scan */}
          {!results && !isScanning && <EmptyState />}
        </div>
      </div>
    </div>
  )
}
