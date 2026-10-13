const categoryColors = {
  "Newsletters":        { bg: "#E6F1FB", color: "#0C447C" },
  "Marketing & promos": { bg: "#FAEEDA", color: "#633806" },
  "Social":             { bg: "#E1F5EE", color: "#085041" },
}

function initials(name) {
  return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("")
}

export default function SenderCard({ sender, isMobile }) {
  const cat = categoryColors[sender.category] || { bg: "#f0f0f0", color: "#555" }
  const isUnsub = sender.recommendation === "unsubscribe"
  return (
    <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 12, padding: "22px 26px", display: "flex", gap: 18, alignItems: "center", flexWrap: isMobile ? "wrap" : "nowrap" }}>
      <div style={{ width: 46, height: 46, borderRadius: "50%", background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: cat.color, flexShrink: 0 }}>
        {initials(sender.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 17, color: "#111" }}>{sender.name}</span>
          <span style={{ fontSize: 12, padding: "3px 11px", borderRadius: 99, background: cat.bg, color: cat.color, fontWeight: 500 }}>{sender.category}</span>
        </div>
        <div style={{ fontSize: 14, color: "#5C3D2E", lineHeight: 1.5 }}>{sender.email} · {sender.emailCount} email{sender.emailCount !== 1 ? "s" : ""} · {sender.reason}</div>
      </div>
      <button
        onClick={() => { if (isUnsub && sender.gmailUrl) window.open(sender.gmailUrl, "_blank") }}
        disabled={!isUnsub}
        style={{ flexShrink: 0, fontSize: 14, fontWeight: 600, padding: "11px 20px", borderRadius: 9, border: "none", background: isUnsub ? "#167458" : "#EAF3DE", color: isUnsub ? "#fff" : "#27500A", cursor: isUnsub ? "pointer" : "default", whiteSpace: "nowrap", width: isMobile ? "100%" : "auto" }}
      >
        {isUnsub ? <><span style={{ fontSize: 20, verticalAlign: "-2px", marginRight: 2 }}>✉️</span> Open in Gmail</> : "✓ Keep"}
      </button>
    </div>
  )
}
