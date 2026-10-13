const steps = [
  { t: "Connect your Google account", d: "" },
  { t: "Hit \"Scan inbox\" to locate senders", d: "" },
  { t: "Hit \"Open in Gmail\" to investigate", d: "We'll whisk you to that sender's latest email so YOU can decide if it deserves the boot. No regrets, no accidental goodbyes." },
]

export default function WelcomeModal({ closing, onDismiss, isMobile }) {
  return (
    <div
      onClick={onDismiss}
      style={{ position: "fixed", inset: 0, background: "rgba(10, 61, 46, 0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20, animation: closing ? "overlayOut 1.1s forwards" : "none" }}
    >
      <style>{`
        @keyframes overlayOut { to { opacity: 0; } }
        @keyframes sparkleAway { 0% { transform: scale(1) rotate(0deg); opacity: 1; } 45% { transform: scale(0.55) rotate(220deg); opacity: 1; } 100% { transform: scale(0) rotate(720deg); opacity: 0; } }
      `}</style>
      {closing ? (
        <div style={{ animation: "sparkleAway 1.1s forwards" }}>
          <svg width="90" height="90" viewBox="0 0 96 96">
            <path d="M48,6 L57,39 L90,48 L57,57 L48,90 L39,57 L6,48 L39,39 Z" fill="#5DCAA5"/>
          </svg>
        </div>
      ) : (
        <div
          onClick={e => e.stopPropagation()}
          style={{ background: "#fff", borderRadius: 18, maxWidth: 640, width: "100%", padding: "32px 34px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
            <img src="/favicon.svg" alt="" width="42" height="42" />
            <h2 style={{ fontSize: isMobile ? 19 : 23, fontWeight: 700, color: "#0a3d2e", margin: 0 }}>Welcome to the Inbox Cleanup Agent</h2>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#5C3D2E", margin: "0 0 22px", lineHeight: 1.5, textAlign: "center", whiteSpace: isMobile ? "normal" : "nowrap" }}>
            Your inbox is a mess. We both know it. Let's fix that in three painless steps:
          </p>

          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 13, marginBottom: 16, alignItems: "flex-start", textAlign: "left" }}>
              <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: "#0a3d2e", color: "#5DCAA5", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "#111" }}>{step.t}</div>
                {step.d && <div style={{ fontSize: 13, color: "#5C3D2E", lineHeight: 1.45 }}>{step.d}</div>}
              </div>
            </div>
          ))}

          <button
            onClick={onDismiss}
            style={{ width: "100%", marginTop: 8, fontSize: 15, fontWeight: 600, padding: "13px", borderRadius: 10, border: "none", background: "#5C3D2E", color: "#fff", cursor: "pointer" }}
          >
            Got it!
          </button>
          <div style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "#5C3D2E", marginTop: 14 }}>Tool created by Aishi Agarwal</div>
        </div>
      )}
    </div>
  )
}
