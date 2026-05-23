export default function Footer() {
  return (
    <footer style={{
      background: "#fff",
      borderTop: "1px solid #e2e8f0",
      padding: "28px 80px 16px",
      fontFamily: "sans-serif"
    }}>

      {/* Top Section */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr 1fr 1.8fr",
        gap: 48,
        marginBottom: 24
      }}>

        {/* Logo + Description */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 24 }}>🚦</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>
              Traffic<span style={{ color: "#6366f1" }}>AI</span>
            </span>
          </div>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, maxWidth: 260 }}>
            TrafficAI is an AI-powered traffic congestion prediction system
            using YOLOv8s and Random Forest to detect vehicles and predict
            congestion levels in real-time.
          </p>
        </div>

        {/* Company Links */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>
            Company
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["About Us", "How It Works", "Contact Us", "Privacy Policy"].map((item) => (
              <span key={item} style={{ fontSize: 14, color: "#64748b", cursor: "pointer" }}
                onMouseEnter={(e) => e.target.style.color = "#6366f1"}
                onMouseLeave={(e) => e.target.style.color = "#64748b"}>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Technology Links */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>
            Technology
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {["YOLOv8s Detection", "Random Forest ML", "Flask Backend", "React Frontend", "SQLite Database"].map((item) => (
              <span key={item} style={{ fontSize: 14, color: "#64748b", cursor: "pointer" }}
                onMouseEnter={(e) => e.target.style.color = "#6366f1"}
                onMouseLeave={(e) => e.target.style.color = "#64748b"}>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
            Subscribe to our newsletter
          </h4>
          <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 16 }}>
            The latest news, articles, and resources, sent to your inbox weekly.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="email"
              placeholder="Enter your email"
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 8,
                border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none"
              }}
              onFocus={(e) => e.target.style.borderColor = "#6366f1"}
              onBlur={(e)  => e.target.style.borderColor = "#e2e8f0"}
            />
            <button style={{
              padding: "10px 20px", borderRadius: 8, border: "none",
              background: "#6366f1", color: "#fff",
              fontSize: 14, fontWeight: 600, cursor: "pointer"
            }}
              onMouseEnter={(e) => e.target.style.background = "#4f46e5"}
              onMouseLeave={(e) => e.target.style.background = "#6366f1"}>
              Subscribe
            </button>
          </div>
        </div>

      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#e2e8f0", marginBottom: 24 }} />

      {/* Bottom */}
{/* Bottom */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
          Copyright 2026 © TrafficAI — All Rights Reserved.
        </p>
      </div>

    </footer>
  );
}