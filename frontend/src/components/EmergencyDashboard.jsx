import { useEffect, useState } from "react";
import api from "../api/axios";

export default function EmergencyDashboard() {
  const [alerts, setAlerts]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [clearing, setClearing] = useState(null);

  const fetchAlerts = () => {
    api.get("/emergency/alerts")
      .then((res) => setAlerts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
    // Har 10 second pe refresh
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const clearRoute = async (id) => {
    setClearing(id);
    try {
      await api.post(`/emergency/clear-route/${id}`);
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
    setClearing(null);
  };

  return (
    <div className="emergency-page">

      {/* Header */}
      <div className="emergency-header">
        <div className="emergency-header-left">
          <div className="emergency-siren">🚨</div>
          <div>
            <h2 className="emergency-title">Ambulance Priority System</h2>
            <p className="emergency-subtitle">
              Real-time emergency vehicle detection & signal control
            </p>
          </div>
        </div>
        <div className="emergency-stats-row">
          <div className="emergency-stat-box red">
            <p className="emergency-stat-num">
              {alerts.filter(a => !a.route_cleared).length}
            </p>
            <p className="emergency-stat-label">Active Alerts</p>
          </div>
          <div className="emergency-stat-box green">
            <p className="emergency-stat-num">
              {alerts.filter(a => a.route_cleared).length}
            </p>
            <p className="emergency-stat-label">Routes Cleared</p>
          </div>
          <div className="emergency-stat-box blue">
            <p className="emergency-stat-num">{alerts.length}</p>
            <p className="emergency-stat-label">Total Alerts</p>
          </div>
        </div>
      </div>

      {/* Signal Status Banner */}
      {alerts.filter(a => !a.route_cleared).length > 0 && (
        <div className="emergency-active-banner">
          <div className="emergency-pulse" />
          <div>
            <p className="emergency-banner-title">
              🚑 ACTIVE EMERGENCY — Signal GREEN Mode
            </p>
            <p className="emergency-banner-sub">
              {alerts.filter(a => !a.route_cleared).length} ambulance(s) detected —
              Traffic signals automatically set to GREEN
            </p>
          </div>
          <div className="signal-lights">
            <div className="signal-light off" />
            <div className="signal-light off" />
            <div className="signal-light green-on" />
          </div>
        </div>
      )}

      {/* No active alerts */}
      {!loading && alerts.filter(a => !a.route_cleared).length === 0 && (
        <div className="emergency-normal-banner">
          <p>✅ Koi active emergency nahi — Traffic normal chal raha hai</p>
        </div>
      )}

      {/* How it works */}
      <div className="emergency-how-row">
        {[
          { icon: "📸", title: "Image Upload",    desc: "Traffic photo upload karo — YOLO analyze karega" },
          { icon: "🚑", title: "Auto Detection",  desc: "Ambulance detect hote hi system alert karta hai" },
          { icon: "🟢", title: "Signal Green",    desc: "Detected route ka signal automatically green hoga" },
          { icon: "🛣️", title: "Route Clear",     desc: "Traffic operators route clear kar sakte hain" },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="emergency-how-card">
            <p className="emergency-how-icon">{icon}</p>
            <p className="emergency-how-title">{title}</p>
            <p className="emergency-how-desc">{desc}</p>
          </div>
        ))}
      </div>

      {/* Alerts table */}
      <div className="emergency-alerts-box">
        <div className="emergency-alerts-header">
          <p className="emergency-alerts-title">🚨 Emergency Alert Log</p>
          <button onClick={fetchAlerts} className="emergency-refresh-btn">
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: 24 }}>
            ⏳ Loading alerts...
          </p>
        ) : alerts.length === 0 ? (
          <div className="emergency-empty">
            <p style={{ fontSize: 32 }}>🚑</p>
            <p>Abhi koi emergency alert nahi</p>
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
              Image Upload pe jaao aur ambulance wali photo upload karo
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Location</th>
                  <th>Vehicles</th>
                  <th>Traffic Level</th>
                  <th>Signal</th>
                  <th>Route Status</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert, i) => (
                  <tr key={alert.id} style={{
                    background: !alert.route_cleared ? "#fff7f7" : "#f0fdf4"
                  }}>
                    <td style={{ color: "#9ca3af" }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>
                      📍 {alert.location_name}
                    </td>
                    <td style={{ fontWeight: 600 }}>{alert.vehicle_count}</td>
                    <td>
                      <span className="dash-badge" style={{
                        background:
                          alert.congestion_level === "High"   ? "#fef2f2" :
                          alert.congestion_level === "Medium" ? "#fefce8" : "#f0fdf4",
                        color:
                          alert.congestion_level === "High"   ? "#991b1b" :
                          alert.congestion_level === "Medium" ? "#854d0e" : "#166534",
                      }}>
                        {alert.congestion_level}
                      </span>
                    </td>
                    <td>
                      <span className="emergency-signal-badge">
                        🟢 {alert.signal_status}
                      </span>
                    </td>
                    <td>
                      {alert.route_cleared ? (
                        <span className="emergency-cleared-badge">
                          ✅ Cleared
                        </span>
                      ) : (
                        <span className="emergency-pending-badge">
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                    <td style={{ color: "#6b7280", fontSize: 12 }}>
                      {alert.timestamp.slice(0, 19).replace("T", " ")}
                    </td>
                    <td>
                      {!alert.route_cleared && (
                        <button
                          onClick={() => clearRoute(alert.id)}
                          disabled={clearing === alert.id}
                          className="emergency-clear-btn"
                        >
                          {clearing === alert.id ? "⏳..." : "🛣️ Clear Route"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}