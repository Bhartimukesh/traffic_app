import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { PieChart, Pie, Legend } from "recharts";
import api from "../api/axios";

const COLOR = { Low: "#22c55e", Medium: "#eab308", High: "#ef4444" };

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("all");

  useEffect(() => {
    api.get("/history")
      .then((res) => setHistory(res.data))
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, []);

  const counts = { Low: 0, Medium: 0, High: 0 };
  history.forEach((h) => {
    if (counts[h.prediction] !== undefined) counts[h.prediction]++;
  });
  const total      = history.length;
  const recentData = [...history].reverse().slice(0, 20);

  const pieData = [
    { name: "High",   value: counts.High,   fill: "#ef4444" },
    { name: "Low",    value: counts.Low,     fill: "#22c55e" },
    { name: "Medium", value: counts.Medium,  fill: "#eab308" },
  ].filter(d => d.value > 0);

  return (
    <div style={{ width: "100%" }}>

      {/* Stats Cards */}
      <div className="dash-stats-row">
        {[
          { label: "Total Predictions", value: total,         bg: "#f3f4f6", text: "#111827" },
          { label: "High Congestion",   value: counts.High,   bg: "#fef2f2", text: "#991b1b" },
          { label: "Medium Congestion", value: counts.Medium, bg: "#fefce8", text: "#854d0e" },
          { label: "Low Congestion",    value: counts.Low,    bg: "#f0fdf4", text: "#166534" },
        ].map((card) => (
          <div key={card.label} className="dash-stat-card" style={{ background: card.bg }}>
            <p className="dash-stat-value" style={{ color: card.text }}>{card.value}</p>
            <p className="dash-stat-label">{card.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="dash-empty"><p>⏳ Loading...</p></div>
      ) : history.length === 0 ? (
        <div className="dash-empty">
          <p style={{ fontSize: 32 }}>📊</p>
          <p>Abhi koi prediction nahi — Image ya Video upload karo</p>
        </div>
      ) : (
        <>
          {/* Charts Row — Bar + Pie side by side */}
          <div className="dash-charts-row">

            {/* Bar Chart */}
            <div className="dash-chart-box">
              <p className="dash-chart-title">📈 Recent Predictions — Vehicle Count</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={recentData}>
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(v) => v.slice(11, 16)}
                    tick={{ fontSize: 10 }}
                    interval={3}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => [v, "Vehicles"]}
                    labelFormatter={(l) => l.slice(0, 19).replace("T", " ")}
                  />
                  <Bar dataKey="vehicle_count" radius={[4, 4, 0, 0]}>
                    {recentData.map((entry, i) => (
                      <Cell key={i} fill={COLOR[entry.prediction] || "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="dash-chart-legend">
                🟢 Low &nbsp; 🟡 Medium &nbsp; 🔴 High
              </p>
            </div>

            {/* Pie Chart */}
            <div className="dash-chart-box">
              <p className="dash-chart-title">🥧 Congestion Distribution</p>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: "center", color: "#9ca3af", marginTop: 80 }}>
                  Data nahi hai
                </p>
              )}
            </div>
          </div>

          {/* History Table with Tabs */}
          <div className="dash-table-box">
            <div className="dash-tabs">
              {[
                { id: "all",   label: "📋 All Predictions" },
                { id: "image", label: "📷 Image"           },
                { id: "video", label: "🎥 Video"           },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  className={`dash-tab-btn ${tab === id ? "active" : ""}`}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Time</th>
                    <th>Vehicles</th>
                    <th>Level</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 20).map((h, i) => (
                    <tr key={i}>
                      <td style={{ color: "#9ca3af" }}>{i + 1}</td>
                      <td style={{ color: "#6b7280" }}>
                        {h.timestamp.slice(0, 19).replace("T", " ")}
                      </td>
                      <td style={{ fontWeight: 600 }}>{h.vehicle_count}</td>
                      <td>
                        <span className="dash-badge" style={{
                          background:
                            h.prediction === "High"   ? "#fef2f2" :
                            h.prediction === "Medium" ? "#fefce8" : "#f0fdf4",
                          color:
                            h.prediction === "High"   ? "#991b1b" :
                            h.prediction === "Medium" ? "#854d0e" : "#166534",
                        }}>
                          {h.prediction === "High"   ? "🔴" :
                           h.prediction === "Medium" ? "🟡" : "🟢"} {h.prediction}
                        </span>
                      </td>
                      <td style={{ color: "#6b7280" }}>{h.confidence}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}