import { useState, useEffect, useRef } from "react";
import api from "../api/axios";

const MAX_GREEN  = 90;
const MIN_GREEN  = 10;

// Traffic signal component
function TrafficSignal({ phase, size = "normal" }) {
  const isLarge = size === "large";
  const sz = isLarge ? 28 : 20;

  return (
    <div style={{
      background: "#1e293b",
      borderRadius: isLarge ? 14 : 10,
      padding: isLarge ? "12px 10px" : "8px 7px",
      display: "flex",
      flexDirection: "column",
      gap: isLarge ? 8 : 5,
      alignItems: "center",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    }}>
      {/* Red */}
      <div style={{
        width: sz, height: sz, borderRadius: "50%",
        background: phase === "red" ? "#ef4444" : "#374151",
        boxShadow: phase === "red"
          ? "0 0 12px #ef4444, 0 0 24px rgba(239,68,68,0.4)"
          : "none",
        transition: "all 0.3s"
      }}/>
      {/* Yellow */}
      <div style={{
        width: sz, height: sz, borderRadius: "50%",
        background: phase === "yellow" ? "#eab308" : "#374151",
        boxShadow: phase === "yellow"
          ? "0 0 12px #eab308, 0 0 24px rgba(234,179,8,0.4)"
          : "none",
        transition: "all 0.3s"
      }}/>
      {/* Green */}
      <div style={{
        width: sz, height: sz, borderRadius: "50%",
        background: phase === "green" ? "#22c55e" : "#374151",
        boxShadow: phase === "green"
          ? "0 0 12px #22c55e, 0 0 24px rgba(34,197,94,0.4)"
          : "none",
        transition: "all 0.3s"
      }}/>
    </div>
  );
}

// Single lane card
function LaneCard({ lane, index, onUpdate, onImageUpload }) {
  const LEVEL_BG = {
    High:   { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b" },
    Medium: { bg: "#fefce8", border: "#fde047", text: "#854d0e" },
    Low:    { bg: "#f0fdf4", border: "#86efac", text: "#166534" },
  };
  const style = LEVEL_BG[lane.level] || LEVEL_BG.Low;

  // Green time bar percentage
  const barPct = Math.round((lane.green_time / MAX_GREEN) * 100);

  return (
    <div className="lane-card" style={{
      border: `2px solid ${style.border}`,
      background: style.bg
    }}>
      {/* Lane header */}
      <div className="lane-card-header">
        <div>
          <p className="lane-name">{lane.name}</p>
          <p className="lane-vehicle-count" style={{ color: style.text }}>
            {lane.vehicle_count} vehicles
          </p>
        </div>
        <TrafficSignal phase={lane.phase || "red"} size="normal" />
      </div>

      {/* Green time bar */}
      <div className="lane-bar-wrap">
        <div className="lane-bar-label">
          <span>Green Time</span>
          <span style={{ fontWeight: 700, color: style.text }}>
            {lane.green_time}s
          </span>
        </div>
        <div className="lane-bar-bg">
          <div
            className="lane-bar-fill"
            style={{
              width: `${barPct}%`,
              background: style.text,
              transition: "width 0.8s ease"
            }}
          />
        </div>
        <div className="lane-bar-minmax">
          <span>{MIN_GREEN}s min</span>
          <span>{MAX_GREEN}s max</span>
        </div>
      </div>

      {/* Timing row */}
      <div className="lane-timing-row">
        <div className="lane-timing-box green-box">
          <p className="lane-timing-val">{lane.green_time}s</p>
          <p className="lane-timing-lbl">🟢 Green</p>
        </div>
        <div className="lane-timing-box yellow-box">
          <p className="lane-timing-val">3s</p>
          <p className="lane-timing-lbl">🟡 Yellow</p>
        </div>
        <div className="lane-timing-box red-box">
          <p className="lane-timing-val">30s</p>
          <p className="lane-timing-lbl">🔴 Red</p>
        </div>
      </div>

      {/* Vehicle count slider */}
      <div className="lane-slider-wrap">
        <label className="lane-slider-label">
          Manual count adjust: {lane.vehicle_count}
        </label>
        <input
          type="range" min={0} max={150}
          value={lane.vehicle_count}
          onChange={(e) => onUpdate(index, +e.target.value)}
          className="lane-slider"
        />
      </div>

      {/* Upload image for this lane */}
      <div
        className="lane-upload-zone"
        onClick={() => document.getElementById(`lane-file-${index}`).click()}
      >
        <input
          id={`lane-file-${index}`}
          type="file" accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => onImageUpload(index, e.target.files[0])}
        />
        <span>📸 Upload lane image</span>
      </div>

      {/* Recommendation */}
      <p className="lane-recommendation" style={{ color: style.text }}>
        {lane.recommendation}
      </p>
    </div>
  );
}

export default function SignalTimingPage() {
  const [lanes, setLanes] = useState([
    { name: "Lane A", vehicle_count: 80, green_time: 60, level: "High",   phase: "green", recommendation: "🚨 Extend green" },
    { name: "Lane B", vehicle_count: 15, green_time: 15, level: "Low",    phase: "red",   recommendation: "✅ Reduce green" },
    { name: "Lane C", vehicle_count: 40, green_time: 36, level: "Medium", phase: "red",   recommendation: "⚠️ Normal green" },
    { name: "Lane D", vehicle_count: 5,  green_time: 10, level: "Low",    phase: "red",   recommendation: "✅ Reduce green" },
  ]);

  const [loading, setLoading]           = useState(false);
  const [simulating, setSimulating]     = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [countdown, setCountdown]       = useState(0);
  const [schedule, setSchedule]         = useState([]);
  const [uploadingLane, setUploadingLane] = useState(null);
  const timerRef                        = useRef(null);

  // Calculate timing from backend
  const calculateTiming = async (updatedLanes) => {
    setLoading(true);
    try {
      const res = await api.post("/signal/calculate", {
        lanes: updatedLanes.map(l => ({
          name:          l.name,
          vehicle_count: l.vehicle_count
        }))
      });

      const timingData = res.data.timing;
      const newLanes = updatedLanes.map((lane, i) => ({
        ...lane,
        green_time:     timingData[i]?.green_time     || lane.green_time,
        level:          timingData[i]?.level          || lane.level,
        recommendation: timingData[i]?.recommendation || lane.recommendation,
        priority_score: timingData[i]?.priority_score || 0,
      }));

      setLanes(newLanes);
      setSchedule(res.data.schedule || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // On mount calculate
  useEffect(() => { calculateTiming(lanes); }, []);

  // Update vehicle count
  const handleUpdate = (index, count) => {
    const updated = lanes.map((l, i) =>
      i === index ? { ...l, vehicle_count: count } : l
    );
    setLanes(updated);
    calculateTiming(updated);
  };

  // Upload image for lane
  const handleImageUpload = async (index, file) => {
    if (!file) return;
    setUploadingLane(index);

    const form = new FormData();
    form.append("file", file);
    form.append("lane_name", lanes[index].name);

    try {
      const res = await api.post("/signal/from-image", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const updated = lanes.map((l, i) =>
        i === index ? {
          ...l,
          vehicle_count: res.data.vehicle_count,
          green_time:    res.data.green_time,
          level:         res.data.level,
          recommendation: res.data.recommendation,
        } : l
      );
      setLanes(updated);
      setSchedule([]);
      await calculateTiming(updated);
    } catch (e) {
      console.error(e);
    }
    setUploadingLane(null);
  };

  // Add new lane
  const addLane = () => {
    if (lanes.length >= 6) return;
    const newLane = {
      name:          `Lane ${String.fromCharCode(65 + lanes.length)}`,
      vehicle_count: 20,
      green_time:    22,
      level:         "Low",
      phase:         "red",
      recommendation: "✅ Reduce green"
    };
    const updated = [...lanes, newLane];
    setLanes(updated);
    calculateTiming(updated);
  };

  // Remove lane
  const removeLane = (index) => {
    if (lanes.length <= 2) return;
    const updated = lanes.filter((_, i) => i !== index);
    setLanes(updated);
    calculateTiming(updated);
  };

  // Simulation
  const startSimulation = () => {
    if (simulating) {
      clearInterval(timerRef.current);
      setSimulating(false);
      setLanes(prev => prev.map(l => ({ ...l, phase: "red" })));
      setCurrentPhase(0);
      setCountdown(0);
      return;
    }

    setSimulating(true);
    let phaseIdx   = 0;
    let timeLeft   = lanes[0].green_time;
    let phaseState = "green";

    setCurrentPhase(0);
    setCountdown(timeLeft);
    setLanes(prev => prev.map((l, i) => ({ ...l, phase: i === 0 ? "green" : "red" })));

    timerRef.current = setInterval(() => {
      timeLeft--;
      setCountdown(timeLeft);

      if (timeLeft <= 0) {
        if (phaseState === "green") {
          phaseState = "yellow";
          timeLeft   = 3;
          setLanes(prev => prev.map((l, i) => ({ ...l, phase: i === phaseIdx ? "yellow" : "red" })));
        } else {
          phaseIdx   = (phaseIdx + 1) % lanes.length;
          phaseState = "green";
          timeLeft   = lanes[phaseIdx].green_time;
          setCurrentPhase(phaseIdx);
          setLanes(prev => prev.map((l, i) => ({ ...l, phase: i === phaseIdx ? "green" : "red" })));
        }
      }
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const totalVehicles = lanes.reduce((s, l) => s + l.vehicle_count, 0);
  const totalCycle    = lanes.reduce((s, l) => s + l.green_time + 3, 0);

  return (
    <div className="signal-page">

      {/* ── STATS ROW ── */}
      <div className="signal-stats-row">
        {[
          { label: "Total Vehicles", value: totalVehicles, icon: "🚗" },
          { label: "Active Lanes",   value: lanes.length,  icon: "🛣️" },
          { label: "Cycle Time",     value: `${totalCycle}s`, icon: "⏱️" },
          { label: "Avg Green",
            value: `${Math.round(lanes.reduce((s,l) => s+l.green_time,0)/lanes.length)}s`,
            icon: "🟢" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="signal-stat-card">
            <p className="signal-stat-icon">{icon}</p>
            <p className="signal-stat-val">{value}</p>
            <p className="signal-stat-lbl">{label}</p>
          </div>
        ))}
      </div>

      {/* ── CONTROLS ── */}
      <div className="signal-controls">
        <button
          onClick={startSimulation}
          className={`signal-sim-btn ${simulating ? "stop" : "start"}`}
        >
          {simulating ? "⏹️ Stop Simulation" : "▶️ Start Live Simulation"}
        </button>

        {simulating && (
          <div className="signal-countdown">
            <span>Lane {lanes[currentPhase]?.name} — </span>
            <span style={{ color: "#22c55e", fontWeight: 700 }}>
              {countdown}s remaining
            </span>
          </div>
        )}

        <button onClick={addLane} className="signal-add-btn"
          disabled={lanes.length >= 6}>
          ➕ Add Lane
        </button>

        <button onClick={() => calculateTiming(lanes)}
          className="signal-refresh-btn" disabled={loading}>
          {loading ? "⏳" : "🔄"} Recalculate
        </button>
      </div>

      {/* ── LANE CARDS ── */}
      <div className="signal-lanes-grid">
        {lanes.map((lane, i) => (
          <div key={i} style={{ position: "relative" }}>
            {/* Remove button */}
            {lanes.length > 2 && (
              <button
                onClick={() => removeLane(i)}
                className="lane-remove-btn"
              >✕</button>
            )}

            {/* Uploading overlay */}
            {uploadingLane === i && (
              <div className="lane-uploading-overlay">
                <p>⏳ Analyzing image...</p>
              </div>
            )}

            <LaneCard
              lane={lane}
              index={i}
              onUpdate={handleUpdate}
              onImageUpload={handleImageUpload}
            />
          </div>
        ))}
      </div>

      {/* ── COMPARISON TABLE ── */}
      <div className="signal-table-box">
        <p className="signal-table-title">
          📊 Signal Timing Comparison — Fixed vs Dynamic
        </p>
        <div style={{ overflowX: "auto" }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Lane</th>
                <th>Vehicles</th>
                <th>Fixed Timer</th>
                <th>Dynamic Timer</th>
                <th>Difference</th>
                <th>Efficiency</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              {lanes.map((lane, i) => {
                const fixed  = 30;
                const diff   = lane.green_time - fixed;
                const effPct = Math.round((lane.vehicle_count / Math.max(lane.green_time, 1)) * 10) / 10;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{lane.name}</td>
                    <td style={{ fontWeight: 600 }}>{lane.vehicle_count}</td>
                    <td style={{ color: "#6b7280" }}>{fixed}s</td>
                    <td>
                      <strong style={{
                        color: lane.green_time > fixed ? "#166534" : "#991b1b"
                      }}>
                        {lane.green_time}s
                      </strong>
                    </td>
                    <td>
                      <span style={{
                        color: diff > 0 ? "#166534" : "#991b1b",
                        fontWeight: 600
                      }}>
                        {diff > 0 ? "+" : ""}{diff}s
                      </span>
                    </td>
                    <td style={{ color: "#6b7280" }}>
                      {effPct} v/s
                    </td>
                    <td>
                      <span className="dash-badge" style={{
                        background:
                          lane.level === "High"   ? "#fef2f2" :
                          lane.level === "Medium" ? "#fefce8" : "#f0fdf4",
                        color:
                          lane.level === "High"   ? "#991b1b" :
                          lane.level === "Medium" ? "#854d0e" : "#166534",
                      }}>
                        {lane.level === "High"   ? "🔴" :
                         lane.level === "Medium" ? "🟡" : "🟢"} {lane.level}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Formula explanation */}
        <div className="signal-formula-box">
          <p className="signal-formula-title">📐 Algorithm Formula</p>
          <div className="signal-formula-grid">
            <div className="signal-formula-card">
              <p className="signal-formula-name">Green Time</p>
              <code className="signal-formula-code">
                Base(30s) + (vehicles × 0.6s)
              </code>
              <p className="signal-formula-range">Range: 10s — 90s</p>
            </div>
            <div className="signal-formula-card">
              <p className="signal-formula-name">Example</p>
              <code className="signal-formula-code">
                80 vehicles → 30 + (80×0.6) = 78s ✅
              </code>
              <code className="signal-formula-code">
                15 vehicles → 30 + (15×0.6) = 39s → clamped → 15s ✅
              </code>
            </div>
            <div className="signal-formula-card">
              <p className="signal-formula-name">Thresholds</p>
              <code className="signal-formula-code">
                &gt; 50 vehicles = 🔴 High
              </code>
              <code className="signal-formula-code">
                20–50 vehicles = 🟡 Medium
              </code>
              <code className="signal-formula-code">
                &lt; 20 vehicles = 🟢 Low
              </code>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}