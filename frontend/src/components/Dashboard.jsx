import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import api from "../api/axios";

const COLOR = { Low: "#22c55e", Medium: "#eab308", High: "#ef4444" };

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/history")
      .then((res) => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const counts = { Low: 0, Medium: 0, High: 0 };
  history.forEach((h) => { if (counts[h.prediction] !== undefined) counts[h.prediction]++; });
  const total = history.length;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Dashboard</h2>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
        Ab tak ki sabhi predictions ka overview
      </p>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Predictions", value: total, bg: "#f3f4f6", text: "#111827" },
          { label: "High Congestion",   value: counts.High, bg: "#fef2f2", text: "#991b1b" },
          { label: "Low Congestion",    value: counts.Low,  bg: "#f0fdf4", text: "#166534" },
        ].map((card) => (
          <div key={card.label} style={{
            background: card.bg, borderRadius: 12,
            padding: "16px", textAlign: "center"
          }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: card.text, margin: 0 }}>
              {card.value}
            </p>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      {loading ? (
        <p style={{ textAlign: "center", color: "#9ca3af" }}>Loading history...</p>
      ) : history.length === 0 ? (
        <div style={{
          border: "1px dashed #d1d5db", borderRadius: 12,
          padding: 40, textAlign: "center", color: "#9ca3af"
        }}>
          <p style={{ fontSize: 32 }}>📊</p>
          <p>Abhi koi prediction nahi hai — Upload page pe jaake photo detect karo</p>
        </div>
      ) : (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 8px" }}>
          <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 12, paddingLeft: 12 }}>
            Recent Predictions — Vehicle Count
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[...history].reverse().slice(0, 20)}>
              <XAxis dataKey="timestamp"
                tickFormatter={(v) => v.slice(11, 16)}
                tick={{ fontSize: 10 }} interval={3} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v) => [v, "Vehicles"]}
                labelFormatter={(l) => l.slice(0, 19).replace("T", " ")} />
              <Bar dataKey="vehicle_count" radius={[4, 4, 0, 0]}>
                {[...history].reverse().slice(0, 20).map((entry, i) => (
                  <Cell key={i} fill={COLOR[entry.prediction] || "#94a3b8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8, paddingLeft: 12 }}>
            🟢 Low &nbsp; 🟡 Medium &nbsp; 🔴 High
          </p>
        </div>
      )}
    </div>
  );
}