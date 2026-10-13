export default function ResultsSummary({ results, totalScanned, search, onSearch, isMobile }) {
  const subscriptionEmails = results
    .filter(s => s.recommendation === "unsubscribe")
    .reduce((acc, s) => acc + (s.emailCount || 0), 0)

  const stats = [
    { icon: "📨", num: results.length, label: "senders found", bg: "#E1F5EE", color: "#0F6E56" },
    { icon: "✂️", num: subscriptionEmails, label: "subscription emails", bg: "#F5EBE0", color: "#5C3D2E" },
    { icon: "🔍", num: totalScanned, label: "emails scanned", bg: "#F1EFE8", color: "#444441" }
  ]

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 24 }}>
      {stats.map(({ icon, num, label, bg, color }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, background: bg, borderRadius: 99, padding: "16px 30px" }}>
          <span style={{ fontSize: 28 }}>{icon}</span>
          <span style={{ fontSize: 19, color }}><b style={{ fontSize: 22 }}>{num}</b> {label}</span>
        </div>
      ))}
      <input
        type="text"
        value={search}
        onChange={e => onSearch(e.target.value)}
        placeholder="👤  Search senders…"
        style={{ marginLeft: isMobile ? 0 : "auto", flex: isMobile ? "1 1 100%" : "0 1 360px", fontSize: 17, padding: "18px 24px", borderRadius: 12, border: "1px solid #ddd", outline: "none", color: "#333", background: "#fff", boxSizing: "border-box" }}
      />
    </div>
  )
}
