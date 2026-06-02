import { useState, useEffect, useRef } from "react";
import {
  MapContainer, TileLayer, Marker, Circle,
  Popup, useMapEvents, LayersControl,
  ZoomControl, ScaleControl
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/axios";

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ── CONSTANTS ────────────────────────────────────────────
const CONGESTION_CONFIG = {
  High:    { color: "#ef4444", glow: "rgba(239,68,68,0.25)",   emoji: "🔴", radius: 400 },
  Medium:  { color: "#eab308", glow: "rgba(234,179,8,0.25)",   emoji: "🟡", radius: 300 },
  Low:     { color: "#22c55e", glow: "rgba(34,197,94,0.25)",   emoji: "🟢", radius: 200 },
  Unknown: { color: "#94a3b8", glow: "rgba(148,163,184,0.15)", emoji: "⚪", radius: 150 },
};

// Sample Indian city junctions — demo data
const SAMPLE_JUNCTIONS = [
  { id: 1,  name: "MG Road Junction",        lat: 12.9716,  lng: 77.5946,  city: "Bangalore",   vehicles: 95,  level: "High",   type: "signal"    },
  { id: 2,  name: "Koramangala Circle",       lat: 12.9352,  lng: 77.6245,  city: "Bangalore",   vehicles: 42,  level: "Medium", type: "roundabout" },
  { id: 3,  name: "Silk Board Junction",      lat: 12.9177,  lng: 77.6228,  city: "Bangalore",   vehicles: 120, level: "High",   type: "flyover"   },
  { id: 4,  name: "Connaught Place",          lat: 28.6315,  lng: 77.2167,  city: "Delhi",       vehicles: 88,  level: "High",   type: "signal"    },
  { id: 5,  name: "India Gate Circle",        lat: 28.6129,  lng: 77.2295,  city: "Delhi",       vehicles: 55,  level: "Medium", type: "roundabout" },
  { id: 6,  name: "Andheri Junction",         lat: 19.1136,  lng: 72.8697,  city: "Mumbai",      vehicles: 78,  level: "High",   type: "signal"    },
  { id: 7,  name: "Bandra-Worli Sea Link",    lat: 19.0383,  lng: 72.8196,  city: "Mumbai",      vehicles: 30,  level: "Low",    type: "highway"   },
  { id: 8,  name: "Anna Salai Junction",      lat: 13.0475,  lng: 80.2569,  city: "Chennai",     vehicles: 65,  level: "Medium", type: "signal"    },
  { id: 9,  name: "Koti Junction",            lat: 17.3850,  lng: 78.4867,  city: "Hyderabad",   vehicles: 48,  level: "Medium", type: "signal"    },
  { id: 10, name: "Charbagh Crossing",        lat: 26.8467,  lng: 80.9462,  city: "Lucknow",     vehicles: 35,  level: "Low",    type: "signal"    },
  { id: 11, name: "Hazratganj Circle",        lat: 26.8528,  lng: 80.9443,  city: "Lucknow",     vehicles: 58,  level: "Medium", type: "roundabout" },
  { id: 12, name: "Park Street Junction",     lat: 22.5513,  lng: 88.3516,  city: "Kolkata",     vehicles: 90,  level: "High",   type: "signal"    },
];

// Custom SVG marker
function createJunctionIcon(level, type, isHotspot = false) {
  const cfg   = CONGESTION_CONFIG[level] || CONGESTION_CONFIG.Unknown;
  const typeIcon = {
    signal:    "🚦",
    roundabout:"🔄",
    flyover:   "🌉",
    highway:   "🛣️",
  }[type] || "📍";

  const size = isHotspot ? 44 : 36;

  return L.divIcon({
    className: "",
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
      ">
        ${isHotspot ? `
          <div style="
            position: absolute; inset: -4px;
            border-radius: 50%;
            background: ${cfg.color};
            opacity: 0.3;
            animation: hotspotPulse 1.5s infinite;
          "></div>
        ` : ""}
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${cfg.color};
          border: 3px solid #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${isHotspot ? 18 : 15}px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.3),
                      0 0 0 3px ${cfg.glow};
          cursor: pointer;
        ">
          ${typeIcon}
        </div>
      </div>
    `,
    iconSize:   [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
  });
}

// Map click handler
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e) });
  return null;
}

// ── MAIN COMPONENT ──────────────────────────────────────
export default function InteractiveMap() {
  const mapRef                          = useRef(null);
  const [junctions, setJunctions]       = useState(SAMPLE_JUNCTIONS);
  const [selectedJunction, setSelected] = useState(null);
  const [filterCity, setFilterCity]     = useState("All");
  const [filterLevel, setFilterLevel]   = useState("All");
  const [showHotspots, setShowHotspots] = useState(true);
  const [showCircles, setShowCircles]   = useState(true);
  const [addMode, setAddMode]           = useState(false);
  const [newPin, setNewPin]             = useState(null);
  const [uploadFile, setUploadFile]     = useState(null);
  const [newLocName, setNewLocName]     = useState("");
  const [analyzing, setAnalyzing]       = useState(false);
  const [mapStyle, setMapStyle]         = useState("street");
  const [stats, setStats]               = useState({});

  // Calculate stats
  useEffect(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    junctions.forEach(j => { if (counts[j.level] !== undefined) counts[j.level]++; });
    setStats({
      total:    junctions.length,
      high:     counts.High,
      medium:   counts.Medium,
      low:      counts.Low,
      hotspots: junctions.filter(j => j.vehicles > 70).length,
      avgVehicles: Math.round(junctions.reduce((s,j) => s + j.vehicles, 0) / junctions.length),
    });
  }, [junctions]);

  const cities = ["All", ...new Set(junctions.map(j => j.city))];

  const filteredJunctions = junctions.filter(j => {
    const cityOk  = filterCity  === "All" || j.city  === filterCity;
    const levelOk = filterLevel === "All" || j.level === filterLevel;
    return cityOk && levelOk;
  });

  const hotspots = filteredJunctions.filter(j => j.vehicles > 70);

  // Map click — add new junction
  const handleMapClick = (e) => {
    if (!addMode) return;
    setNewPin({ lat: e.latlng.lat, lng: e.latlng.lng });
  };

  // Analyze uploaded image
  const analyzeImage = async () => {
    if (!uploadFile || !newPin) return;
    setAnalyzing(true);

    const form = new FormData();
    form.append("file", uploadFile);

    try {
      const res  = await api.post("/detect-and-predict", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const data = res.data;

      const newJunction = {
        id:       Date.now(),
        name:     newLocName || `Junction ${junctions.length + 1}`,
        lat:      newPin.lat,
        lng:      newPin.lng,
        city:     "Custom",
        vehicles: data.vehicle_count,
        level:    data.prediction,
        type:     "signal",
        confidence: data.confidence,
        timestamp: new Date().toLocaleString(),
      };

      setJunctions(prev => [...prev, newJunction]);
      setSelected(newJunction.id);
      setAddMode(false);
      setNewPin(null);
      setUploadFile(null);
      setNewLocName("");

      // Pan to new junction
      if (mapRef.current) {
        mapRef.current.panTo([newJunction.lat, newJunction.lng]);
        mapRef.current.setZoom(14);
      }
    } catch (e) {
      alert("Backend se connect nahi hua!");
    }
    setAnalyzing(false);
  };

  // Fly to junction
  const flyToJunction = (j) => {
    setSelected(j.id);
    if (mapRef.current) {
      mapRef.current.flyTo([j.lat, j.lng], 14, { duration: 1.2 });
    }
  };

  // Map tile URLs
  const TILES = {
    street: {
      url:   "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attr:  "© OpenStreetMap",
      label: "🗺️ Street"
    },
    topo: {
      url:   "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attr:  "© OpenTopoMap",
      label: "🏔️ Topo"
    },
    dark: {
      url:   "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
      attr:  "© Stadia Maps",
      label: "🌑 Dark"
    },
  };

  const tile = TILES[mapStyle];

  return (
    <div className="imap-page">

      {/* ── STATS ROW ── */}
      <div className="imap-stats-row">
        {[
          { icon: "📍", label: "Total Junctions",  value: stats.total,       bg: "#f8fafc" },
          { icon: "🔴", label: "High Congestion",  value: stats.high,        bg: "#fef2f2" },
          { icon: "🟡", label: "Medium",            value: stats.medium,      bg: "#fefce8" },
          { icon: "🟢", label: "Low / Clear",       value: stats.low,         bg: "#f0fdf4" },
          { icon: "🌡️", label: "Hotspots",          value: stats.hotspots,    bg: "#fff7ed" },
          { icon: "🚗", label: "Avg Vehicles",      value: stats.avgVehicles, bg: "#eff6ff" },
        ].map(({ icon, label, value, bg }) => (
          <div key={label} className="imap-stat-card" style={{ background: bg }}>
            <p className="imap-stat-icon">{icon}</p>
            <p className="imap-stat-val">{value}</p>
            <p className="imap-stat-lbl">{label}</p>
          </div>
        ))}
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="imap-main-layout">

        {/* LEFT — Sidebar */}
        <div className="imap-sidebar">

          {/* Map style */}
          <div className="imap-section">
            <p className="imap-section-title">🗺️ Map Style</p>
            <div className="imap-btn-group">
              {Object.entries(TILES).map(([key, t]) => (
                <button key={key}
                  className={`imap-style-btn ${mapStyle === key ? "active" : ""}`}
                  onClick={() => setMapStyle(key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="imap-section">
            <p className="imap-section-title">🔍 Filters</p>
            <select
              value={filterCity}
              onChange={e => setFilterCity(e.target.value)}
              className="imap-select"
            >
              {cities.map(c => <option key={c}>{c}</option>)}
            </select>
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              className="imap-select"
              style={{ marginTop: 8 }}
            >
              {["All", "High", "Medium", "Low"].map(l => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Toggles */}
          <div className="imap-section">
            <p className="imap-section-title">👁️ Layers</p>
            {[
              { label: "🌡️ Show Hotspots",       val: showHotspots, set: setShowHotspots },
              { label: "⭕ Show Circles",         val: showCircles,  set: setShowCircles  },
            ].map(({ label, val, set }) => (
              <div key={label} className="imap-toggle-row">
                <span className="imap-toggle-label">{label}</span>
                <div
                  className={`imap-toggle ${val ? "on" : ""}`}
                  onClick={() => set(!val)}
                >
                  <div className="imap-toggle-thumb" />
                </div>
              </div>
            ))}
          </div>

          {/* Add junction */}
          <div className="imap-section">
            <p className="imap-section-title">➕ Add Junction</p>
            <button
              className={`imap-add-btn ${addMode ? "cancel" : ""}`}
              onClick={() => { setAddMode(!addMode); setNewPin(null); }}
            >
              {addMode ? "❌ Cancel" : "📍 Click map to pin"}
            </button>

            {addMode && (
              <div className="imap-add-form">
                <p className="imap-add-hint">
                  {newPin
                    ? `📍 ${newPin.lat.toFixed(4)}, ${newPin.lng.toFixed(4)}`
                    : "Map pe click karo location select karne ke liye"}
                </p>
                <input
                  type="text"
                  placeholder="Junction naam..."
                  value={newLocName}
                  onChange={e => setNewLocName(e.target.value)}
                  className="imap-input"
                />
                <div
                  className="imap-file-zone"
                  onClick={() => document.getElementById("imap-file").click()}
                >
                  <input
                    id="imap-file" type="file" accept="image/*"
                    style={{ display: "none" }}
                    onChange={e => setUploadFile(e.target.files[0])}
                  />
                  {uploadFile
                    ? <span>📸 {uploadFile.name}</span>
                    : <span>📷 Traffic image upload karo</span>
                  }
                </div>
                <button
                  className="imap-analyze-btn"
                  onClick={analyzeImage}
                  disabled={!uploadFile || !newPin || analyzing}
                >
                  {analyzing ? "⏳ Analyzing..." : "🔍 Analyze & Add"}
                </button>
              </div>
            )}
          </div>

          {/* Junction list */}
          <div className="imap-section imap-junction-list">
            <p className="imap-section-title">
              📋 Junctions ({filteredJunctions.length})
            </p>
            <div className="imap-list-scroll">
              {filteredJunctions.map(j => {
                const cfg = CONGESTION_CONFIG[j.level];
                return (
                  <div
                    key={j.id}
                    className={`imap-list-item ${selectedJunction === j.id ? "selected" : ""}`}
                    onClick={() => flyToJunction(j)}
                  >
                    <div className="imap-list-dot"
                      style={{ background: cfg.color }} />
                    <div className="imap-list-info">
                      <p className="imap-list-name">{j.name}</p>
                      <p className="imap-list-meta">
                        {j.vehicles} vehicles · {j.city}
                      </p>
                    </div>
                    <span className="imap-list-badge"
                      style={{ color: cfg.color }}>
                      {cfg.emoji}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT — Map */}
        <div className="imap-map-wrapper">

          {/* Add mode banner */}
          {addMode && (
            <div className="imap-add-banner">
              📍 Map pe click karo junction location select karne ke liye
            </div>
          )}

          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            className="imap-leaflet"
            zoomControl={false}
            ref={mapRef}
          >
            <ZoomControl position="bottomright" />
            <ScaleControl position="bottomleft" />

            <TileLayer url={tile.url} attribution={tile.attr} />

            <MapClickHandler onMapClick={handleMapClick} />

            {/* New pin (unanalyzed) */}
            {newPin && (
              <Marker position={[newPin.lat, newPin.lng]}>
                <Popup>📍 New location — image upload karo sidebar mein</Popup>
              </Marker>
            )}

            {/* All junctions */}
            {filteredJunctions.map(j => {
              const cfg       = CONGESTION_CONFIG[j.level] || CONGESTION_CONFIG.Unknown;
              const isHotspot = showHotspots && j.vehicles > 70;
              const isSelected = selectedJunction === j.id;

              return (
                <div key={j.id}>
                  {/* Circle heatmap */}
                  {showCircles && (
                    <Circle
                      center={[j.lat, j.lng]}
                      radius={isHotspot ? cfg.radius * 1.5 : cfg.radius}
                      pathOptions={{
                        color:       cfg.color,
                        fillColor:   cfg.color,
                        fillOpacity: isHotspot ? 0.25 : 0.12,
                        weight:      isSelected ? 2 : 1,
                      }}
                    />
                  )}

                  {/* Marker */}
                  <Marker
                    position={[j.lat, j.lng]}
                    icon={createJunctionIcon(j.level, j.type, isHotspot)}
                    eventHandlers={{
                      click: () => setSelected(j.id)
                    }}
                  >
                    <Popup maxWidth={260}>
                      <div style={{ fontFamily: "sans-serif", minWidth: 220 }}>

                        {/* Header */}
                        <div style={{
                          background: cfg.color,
                          margin: "-6px -12px 10px",
                          padding: "10px 14px",
                          borderRadius: "6px 6px 0 0",
                          color: "#fff"
                        }}>
                          <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>
                            {j.name}
                          </p>
                          <p style={{ fontSize: 11, opacity: 0.85, margin: "2px 0 0" }}>
                            {j.city} · {j.type}
                          </p>
                        </div>

                        {/* Stats */}
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8, marginBottom: 10
                        }}>
                          {[
                            { label: "Vehicles",    value: j.vehicles  },
                            { label: "Status",      value: j.level     },
                            { label: "Lat",         value: j.lat.toFixed(4) },
                            { label: "Lng",         value: j.lng.toFixed(4) },
                          ].map(({ label, value }) => (
                            <div key={label} style={{
                              background: "#f8fafc",
                              borderRadius: 6, padding: "6px 8px"
                            }}>
                              <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>{label}</p>
                              <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "#1e293b" }}>
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Congestion bar */}
                        <div style={{ marginBottom: 8 }}>
                          <div style={{
                            display: "flex", justifyContent: "space-between",
                            fontSize: 11, color: "#6b7280", marginBottom: 4
                          }}>
                            <span>Congestion</span>
                            <span>{Math.min(100, Math.round(j.vehicles / 1.2))}%</span>
                          </div>
                          <div style={{
                            height: 8, background: "#f1f5f9",
                            borderRadius: 99, overflow: "hidden"
                          }}>
                            <div style={{
                              width: `${Math.min(100, Math.round(j.vehicles / 1.2))}%`,
                              height: "100%",
                              background: cfg.color,
                              borderRadius: 99,
                            }} />
                          </div>
                        </div>

                        {/* Status badge */}
                        <div style={{
                          background: cfg.color + "20",
                          border: `1px solid ${cfg.color}`,
                          borderRadius: 6, padding: "6px 10px",
                          textAlign: "center",
                          fontSize: 12, fontWeight: 600,
                          color: cfg.color
                        }}>
                          {cfg.emoji} {j.level} Congestion
                          {j.vehicles > 70 ? " 🌡️ Hotspot" : ""}
                        </div>

                        {j.timestamp && (
                          <p style={{ fontSize: 10, color: "#9ca3af", margin: "8px 0 0", textAlign: "center" }}>
                            Added: {j.timestamp}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                </div>
              );
            })}
          </MapContainer>

          {/* Legend overlay */}
          <div className="imap-legend">
            <p className="imap-legend-title">Legend</p>
            {Object.entries(CONGESTION_CONFIG)
              .filter(([k]) => k !== "Unknown")
              .map(([level, cfg]) => (
                <div key={level} className="imap-legend-item">
                  <div className="imap-legend-dot" style={{ background: cfg.color }} />
                  <span>{cfg.emoji} {level}</span>
                </div>
              ))}
            <div className="imap-legend-divider" />
            <div className="imap-legend-item">
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                ⭕ Circle = congestion radius
              </span>
            </div>
            <div className="imap-legend-item">
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                🌡️ Pulsing = hotspot (&gt;70 vehicles)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── HOTSPOTS TABLE ── */}
      {showHotspots && hotspots.length > 0 && (
        <div className="imap-hotspot-box">
          <p className="imap-hotspot-title">
            🌡️ Congestion Hotspots — {hotspots.length} locations
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Junction</th>
                  <th>City</th>
                  <th>Vehicles</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {hotspots
                  .sort((a, b) => b.vehicles - a.vehicles)
                  .map((j, i) => {
                    const cfg = CONGESTION_CONFIG[j.level];
                    return (
                      <tr key={j.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => flyToJunction(j)}
                      >
                        <td style={{ fontWeight: 700, color: i < 3 ? "#ef4444" : "#6b7280" }}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </td>
                        <td style={{ fontWeight: 600 }}>{j.name}</td>
                        <td style={{ color: "#6b7280" }}>{j.city}</td>
                        <td>
                          <strong style={{ color: cfg.color }}>{j.vehicles}</strong>
                        </td>
                        <td>
                          <span className="dash-badge" style={{
                            background: cfg.color + "20",
                            color: cfg.color,
                          }}>
                            {cfg.emoji} {j.level}
                          </span>
                        </td>
                        <td style={{ color: "#6b7280", textTransform: "capitalize" }}>
                          {j.type}
                        </td>
                        <td>
                          <button
                            className="imap-fly-btn"
                            onClick={(e) => { e.stopPropagation(); flyToJunction(j); }}
                          >
                            🎯 Focus
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}