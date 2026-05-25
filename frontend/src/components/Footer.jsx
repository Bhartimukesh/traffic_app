export default function Footer() {
  return (
    <footer style={{
      background: "#f8fafc",
      borderTop: "1px solid #e2e8f0",
      padding: "14px 80px 8px",
      fontFamily: "sans-serif"
    }}>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr 1fr 1.8fr",
        gap: 32,
        marginBottom: 10
      }}>

        {/* Logo + Description */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>🚦</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>
              Traffic<span style={{ color: "#6366f1" }}>AI</span>
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, maxWidth: 220, margin: 0 }}>
            AI-powered traffic congestion prediction using YOLOv8s and Random Forest.
          </p>
        </div>

        {/* Company */}
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 8, marginTop: 0 }}>
            Company
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {["About Us", "How It Works", "Contact Us", "Privacy Policy"].map((item) => (
              <span key={item} style={{ fontSize: 12, color: "#64748b", cursor: "pointer" }}
                onMouseEnter={(e) => e.target.style.color = "#6366f1"}
                onMouseLeave={(e) => e.target.style.color = "#64748b"}>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Technology */}
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 8, marginTop: 0 }}>
            Technology
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {["YOLOv8s Detection", "Random Forest ML", "Flask Backend", "React Frontend", "SQLite Database"].map((item) => (
              <span key={item} style={{ fontSize: 12, color: "#64748b", cursor: "pointer" }}
                onMouseEnter={(e) => e.target.style.color = "#6366f1"}
                onMouseLeave={(e) => e.target.style.color = "#64748b"}>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 6, marginTop: 0 }}>
            Subscribe to our newsletter
          </h4>
          <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5, marginBottom: 8, marginTop: 0 }}>
            Latest news and resources, sent to your inbox weekly.
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="email"
              placeholder="Enter your email"
              style={{
                flex: 1, padding: "7px 10px", borderRadius: 7,
                border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none"
              }}
              onFocus={(e) => e.target.style.borderColor = "#6366f1"}
              onBlur={(e)  => e.target.style.borderColor = "#e2e8f0"}
            />
            <button style={{
              padding: "7px 14px", borderRadius: 7, border: "none",
              background: "#6366f1", color: "#fff",
              fontSize: 12, fontWeight: 600, cursor: "pointer"
            }}
              onMouseEnter={(e) => e.target.style.background = "#4f46e5"}
              onMouseLeave={(e) => e.target.style.background = "#6366f1"}>
              Subscribe
            </button>
          </div>
        </div>

      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#e2e8f0", marginBottom: 6 }} />

      {/* Copyright */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
          Copyright 2026 © TrafficAI — All Rights Reserved.
        </p>
      </div>

    </footer>
  );
}