const sidebarItems = [
  { label: "All senders", key: "All" },
  { label: "Newsletters", key: "Newsletters" },
  { label: "Marketing & promos", key: "Marketing & promos" },
  { label: "Social", key: "Social" },
]

export default function Sidebar({ authed, results, activeTab, onSelectTab, isMobile }) {
  return (
    <div style={{ width: isMobile ? "100%" : 300, background: "#0a3d2e", display: "flex", flexDirection: "column", padding: "28px 16px", flexShrink: 0, boxSizing: "border-box", position: isMobile ? "static" : "sticky", top: 0, height: isMobile ? "auto" : "100vh" }}>
      <div style={{ fontSize: isMobile ? 24 : 30, fontWeight: 700, color: "#fff", lineHeight: "1.2", marginBottom: 8, textAlign: "center" }}>{isMobile ? "Inbox Cleanup Agent" : <>Inbox<br/>Cleanup<br/>Agent</>}</div>
      <div style={{ fontSize: 11, color: "#5DCAA5", marginBottom: 32, display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: authed ? "#5DCAA5" : "#888", display: "inline-block" }}></span>
        {authed ? "Gmail connected" : "Not connected"}
      </div>

      <div style={{ fontSize: 10, color: "#5DCAA5", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 10 }}>Categories</div>
      {sidebarItems.map(item => {
        const count = results ? (item.key === "All" ? results.length : results.filter(s => s.category === item.key).length) : null
        const isActive = activeTab === item.key
        return (
          <div
            key={item.key}
            onClick={() => onSelectTab(item.key)}
            style={{ fontSize: 13, color: isActive ? "#fff" : "#9FE1CB", padding: "9px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: isActive ? "#1D9E75" : "transparent", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: isActive ? 500 : 400 }}
          >
            <span>{item.label}</span>
            {count !== null && <span style={{ fontSize: 11, background: isActive ? "#0F6E56" : "#0a3d2e", color: isActive ? "#9FE1CB" : "#5DCAA5", borderRadius: 99, padding: "1px 7px" }}>{count}</span>}
          </div>
        )
      })}

      <div style={{ marginTop: "auto", fontSize: 11, color: "#9FE1CB", fontWeight: 600, paddingBottom: 12, textAlign: "center" }}>
        Tool created by Aishi Agarwal
      </div>
      <div style={{ fontSize: 11, color: "#5DCAA5", paddingTop: 16, borderTop: "1px solid #1D9E75", textAlign: "center" }}>
        {results ? `${results.length} senders found` : "No scan yet"}
      </div>
    </div>
  )
}
