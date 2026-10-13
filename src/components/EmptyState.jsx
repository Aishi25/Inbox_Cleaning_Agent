export default function EmptyState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center", color: "#7a5c4e" }}>
      <img src="/favicon.svg" alt="" style={{ width: 260, marginBottom: 28 }} />
      <div style={{ fontSize: 19, fontWeight: 600, color: "#0a3d2e", marginBottom: 8 }}>Your inbox, decluttered</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: "#555", maxWidth: 360, lineHeight: 1.5 }}>Sign in with Google and scan your inbox to find subscriptions you can cut.</div>
    </div>
  )
}
