import { useState, useEffect } from "react";
import api from "../api/axios";

const SEVERITY_CONFIG = {
  Critical: { bg: "#fff1f2", border: "#fda4af", text: "#9f1239", icon: "🔴", badge: "#ef4444" },
  High:     { bg: "#fff7ed", border: "#fdba74", text: "#9a3412", icon: "🟠", badge: "#f97316" },
  Medium:   { bg: "#fefce8", border: "#fde047", text: "#854d0e", icon: "🟡", badge: "#eab308" },
  None:     { bg: "#f0fdf4", border: "#86efac", text: "#166534", icon: "🟢", badge: "#22c55e" },
};

const ACCIDENT_TYPE_CONFIG = {
  collision:  { icon: "💥", label: "Vehicle Collision",   color: "#ef4444" },
  overturned: { icon: "🔄", label: "Vehicle Overturned",  color: "#f97316" },
  pileup:     { icon: "🚗", label: "Vehicle Pile-up",     color: "#a855f7" },
};

export default function AccidentDetection() {
  const [file, setFile]             = useState(null);
  const [preview, setPreview]       = useState(null);
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [locationName, setLocName]  = useState("");
  const [showAnnotated, setAnnotated] = useState(true);
  const [alerts, setAlerts]         = useState([]);
  const [resolving, setResolving]   = useState(null);

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = () => {
    api.get("/accident/alerts")
      .then(res => setAlerts(res.data))
      .catch(console.error);
  };

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError("");
  };

  const handleSubmit = async () => {
    if (!file) return setError("Pehle image select karo.");
    setLoading(true);
    setError("");

    const form = new FormData();
    form.append("file", file);
    form.append("location_name", locationName || "Unknown Junction");

    try {
      const res = await api.post("/accident/detect", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(res.data);
      fetchAlerts();
    } catch (err) {
      setError(err.response?.data?.error || "Backend se connect nahi hua.");
    }
    setLoading(false);
  };

  const handleResolve = async (id) => {
    setResolving(id);
    await api.post(`/accident/resolve/${id}`);
    fetchAlerts();
    setResolving(null);
  };

  const sev    = result ? SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.None : null;
  const active = alerts.filter(a => a.status === "Active");

  return (
    <div className="accident-page">

      {/* ── LIVE ALERT BANNER ── */}
      {active.length > 0 && (
        <div className="accident-live-banner">
          <div className="accident-pulse-dot" />
          <div>
            <p className="accident-banner-title">
              ⚠️ {active.length} Active Accident Alert{active.length > 1 ? "s" : ""}
            </p>
            <p className="accident-banner-sub">
              {active[0].description} — {active[0].location_name}
            </p>
          </div>
          <div className="accident-banner-severity">
            {active[0].severity}
          </div>
        </div>
      )}

      {/* ── STATS ROW ── */}
      <div className="accident-stats-row">
        {[
          { label: "Total Alerts",    value: alerts.length,                              bg: "#f8fafc", icon: "📋" },
          { label: "Active",          value: active.length,                              bg: "#fff1f2", icon: "🔴" },
          { label: "Resolved",        value: alerts.filter(a=>a.status==="Resolved").length, bg: "#f0fdf4", icon: "✅" },
          { label: "Critical",        value: alerts.filter(a=>a.severity==="Critical").length, bg: "#fff1f2", icon: "💥" },
        ].map(({ label, value, bg, icon }) => (
          <div key={label} className="accident-stat-card" style={{ background: bg }}>
            <p style={{ fontSize: 24, margin: 0 }}>{icon}</p>
            <p className="accident-stat-val">{value}</p>
            <p className="accident-stat-lbl">{label}</p>
          </div>
        ))}
      </div>

      {/* ── MAIN ROW ── */}
      <div className="accident-main-row">

        {/* LEFT — Upload panel */}
        <div className="accident-left-panel">
          <p className="accident-panel-title">📸 Upload Traffic Image</p>

          {/* Upload zone */}
          <div
            className="accident-upload-zone"
            onClick={() => document.getElementById("acc-file").click()}
          >
            <input
              id="acc-file" type="file" accept="image/*"
              style={{ display: "none" }}
              onChange={e => handleFile(e.target.files[0])}
            />
            {preview ? (
              <img src={preview} alt="preview" className="accident-preview-img" />
            ) : (
              <>
                <p style={{ fontSize: 40, margin: 0 }}>🚗💥🚗</p>
                <p className="accident-upload-text">Traffic image upload karo</p>
                <p className="accident-upload-sub">Collision · Overturned · Pile-up detect hoga</p>
              </>
            )}
          </div>

          {/* Location */}
          <input
            type="text"
            placeholder="📍 Junction naam (e.g. Junction 3, MG Road)"
            value={locationName}
            onChange={e => setLocName(e.target.value)}
            className="accident-input"
          />

          {/* Analyze button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !file}
            className={`accident-analyze-btn ${loading || !file ? "disabled" : ""}`}
          >
            {loading ? "⏳ Analyzing..." : "🔍 Detect Accidents"}
          </button>

          {error && <div className="accident-error">⚠️ {error}</div>}

          {/* Detection types info */}
          <div className="accident-types-info">
            <p className="accident-types-title">🔍 What we detect:</p>
            {Object.entries(ACCIDENT_TYPE_CONFIG).map(([type, cfg]) => (
              <div key={type} className="accident-type-row">
                <span>{cfg.icon}</span>
                <div>
                  <p className="accident-type-name">{cfg.label}</p>
                  <p className="accident-type-desc">
                    {type === "collision"  && "2+ vehicles overlapping — direct impact"}
                    {type === "overturned" && "Vehicle aspect ratio abnormal — on side/roof"}
                    {type === "pileup"     && "4+ vehicles clustered — chain reaction"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Result */}
        <div className="accident-right-panel">

          {!result ? (
            <div className="accident-empty">
              <p style={{ fontSize: 48 }}>🚦</p>
              <p>Image upload karo — accident detection result yahan dikhega</p>
            </div>
          ) : (
            <>
              {/* Severity card */}
              <div className="accident-severity-card" style={{
                background: sev.bg, border: `2px solid ${sev.border}`
              }}>
                <div className="accident-severity-left">
                  <p className="accident-severity-label" style={{ color: sev.text }}>
                    Detection Result
                  </p>
                  <p className="accident-severity-val" style={{ color: sev.text }}>
                    {result.has_accident
                      ? `${sev.icon} ${result.severity} — ${result.accident_count} incident${result.accident_count > 1 ? "s" : ""}`
                      : "✅ No Accident Detected"}
                  </p>
                  <p className="accident-severity-meta" style={{ color: sev.text }}>
                    {result.vehicle_count} vehicles · {result.location_name}
                  </p>
                </div>

                {result.has_accident && (
                  <div className="accident-severity-right">
                    <div className="accident-severity-badge"
                      style={{ background: sev.badge }}>
                      {result.severity}
                    </div>
                  </div>
                )}
              </div>

              {/* Accident list */}
              {result.accidents?.length > 0 && (
                <div className="accident-list-box">
                  <p className="accident-list-title">
                    ⚠️ Detected Incidents ({result.accidents.length})
                  </p>
                  {result.accidents.map((acc, i) => {
                    const cfg  = ACCIDENT_TYPE_CONFIG[acc.type] || {};
                    const scfg = SEVERITY_CONFIG[acc.severity]  || {};
                    return (
                      <div key={i} className="accident-incident-card"
                        style={{ borderLeft: `4px solid ${cfg.color}` }}>
                        <div className="accident-incident-header">
                          <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                          <div>
                            <p className="accident-incident-type">{cfg.label}</p>
                            <p className="accident-incident-desc">{acc.description}</p>
                          </div>
                          <span className="accident-severity-pill"
                            style={{
                              background: scfg.bg,
                              color: scfg.text,
                              border: `1px solid ${scfg.border}`
                            }}>
                            {acc.severity}
                          </span>
                        </div>
                        {acc.iou_score > 0 && (
                          <p className="accident-iou">
                            Overlap score: <strong>{acc.iou_score}%</strong>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Annotated image */}
              {result.annotated_image && (
                <div className="accident-img-box">
                  <div className="accident-img-header">
                    <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>
                      🖼️ Detection Result
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["Annotated", "Original"].map(lbl => (
                        <button key={lbl}
                          onClick={() => setAnnotated(lbl === "Annotated")}
                          className={`map-toggle-btn ${(lbl==="Annotated")===showAnnotated?"active":""}`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <img
                    src={showAnnotated
                      ? `data:image/jpeg;base64,${result.annotated_image}`
                      : preview}
                    alt="result"
                    style={{ width: "100%", display: "block" }}
                  />
                  {result.has_accident && (
                    <div className="accident-img-legend">
                      <span>💥 Red = Collision</span>
                      <span>🔄 Orange = Overturned</span>
                      <span>🟣 Purple = Pile-up</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── ALERTS TABLE ── */}
      <div className="accident-alerts-box">
        <div className="accident-alerts-header">
          <p className="accident-alerts-title">📋 Accident Alert Log</p>
          <button onClick={fetchAlerts} className="emergency-refresh-btn">
            🔄 Refresh
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="accident-empty-table">
            <p>Koi accident alert nahi — image upload karke test karo</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Vehicles</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a, i) => {
                  const scfg = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.Medium;
                  const tcfg = ACCIDENT_TYPE_CONFIG[a.accident_type] || {};
                  return (
                    <tr key={a.id} style={{
                      background: a.status === "Active" ? "#fff9f9" : "transparent"
                    }}>
                      <td style={{ color: "#9ca3af" }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>📍 {a.location_name}</td>
                      <td>
                        <span>{tcfg.icon} {tcfg.label || a.accident_type}</span>
                      </td>
                      <td>
                        <span className="dash-badge" style={{
                          background: scfg.bg, color: scfg.text,
                          border: `1px solid ${scfg.border}`
                        }}>
                          {scfg.icon} {a.severity}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{a.vehicle_count}</td>
                      <td style={{ fontSize: 12, color: "#6b7280", maxWidth: 200 }}>
                        {a.description}
                      </td>
                      <td>
                        <span className="dash-badge" style={{
                          background: a.status === "Active" ? "#fef2f2" : "#f0fdf4",
                          color:      a.status === "Active" ? "#991b1b" : "#166534",
                        }}>
                          {a.status === "Active" ? "🔴 Active" : "✅ Resolved"}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>
                        {a.timestamp.slice(0, 19).replace("T", " ")}
                      </td>
                      <td>
                        {a.status === "Active" && (
                          <button
                            onClick={() => handleResolve(a.id)}
                            disabled={resolving === a.id}
                            className="emergency-clear-btn"
                          >
                            {resolving === a.id ? "⏳" : "✅ Resolve"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}