export default function TopBar({ title, authed, isScanning, onScan, onSignOut, isMobile }) {
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #eee", padding: isMobile ? "14px 18px" : "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, flexWrap: "wrap", gap: 10 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>
        {title}
      </div>
      {authed ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onSignOut}
            style={{ fontSize: 14, padding: "12px 20px", borderRadius: 8, border: "1px solid #C4956A", background: "#fff", color: "#5C3D2E", fontWeight: 600, cursor: "pointer" }}
          >
            Sign out
          </button>
          <button
            onClick={onScan}
            disabled={isScanning}
            style={{ fontSize: 14, padding: "12px 20px", borderRadius: 8, border: "none", background: isScanning ? "#ccc" : "#5C3D2E", color: "#fff", fontWeight: 600, cursor: isScanning ? "default" : "pointer", display: "flex", alignItems: "center", gap: 5 }}
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
  )
}
