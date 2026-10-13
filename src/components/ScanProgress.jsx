export default function ScanProgress({ stages, stage }) {
  const percent = (stage / stages.length) * 100
  return (
    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "20px 22px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#0a3d2e" }}>
          {stages[Math.min(stage, stages.length - 1)]}…
        </span>
        <span style={{ fontSize: 13, color: "#5C3D2E" }}>
          {Math.round(percent)}%
        </span>
      </div>
      <div style={{ height: 8, background: "#EAF0EC", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${percent}%`, background: "#1D9E75", borderRadius: 99, transition: "width 0.5s ease" }} />
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        {stages.map((label, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" style={{ transform: i === stage ? "scale(1.25)" : "scale(1)", transition: "transform 0.3s" }}>
              <path d="M8,0 L9.6,6.4 L16,8 L9.6,9.6 L8,16 L6.4,9.6 L0,8 L6.4,6.4 Z" fill={i < stage ? "#1D9E75" : i === stage ? "#5DCAA5" : "#D7E2DC"} />
            </svg>
            <span style={{ fontSize: 9.5, color: i <= stage ? "#0a3d2e" : "#aaa", textAlign: "center", lineHeight: 1.2 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
