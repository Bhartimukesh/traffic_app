import { useState } from "react";
import api from "../api/axios";

const LEVEL_STYLE = {
  Low:    { bg: "#f0fdf4", border: "#86efac", text: "#166534", emoji: "🟢" },
  Medium: { bg: "#fefce8", border: "#fde047", text: "#854d0e", emoji: "🟡" },
  High:   { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", emoji: "🔴" },
};

const RECOMMENDATIONS = {
  Low:    "✅ Traffic is normal. It is a good time to travel.",
  Medium: "⚠️ There is some traffic. Consider an alternate route. 10-15 minutes extra time may be expected.",
  High:   "🚨 Heavy congestion! Avoid this route. 30-45 minutes delay expected.",
};

const TIPS = {
  Low:    { bg: "#f0fdf4", border: "#86efac", text: "#166534" },
  Medium: { bg: "#fffbeb", border: "#fcd34d", text: "#92400e" },
  High:   { bg: "#fff1f2", border: "#fda4af", text: "#9f1239" },
};

export default function UploadPage() {
  const [file, setFile]                   = useState(null);
  const [preview, setPreview]             = useState(null);
  const [result, setResult]               = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [showAnnotated, setShowAnnotated] = useState(true);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return setError("Please select a photo first.");
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await api.post("/detect-and-predict", form);
      setResult(res.data);
      setShowAnnotated(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to connect to the backend. Please run the Flask server.");
    }
    setLoading(false);
  };

  const s   = result ? LEVEL_STYLE[result.prediction] : null;
  const tip = result ? TIPS[result.prediction]        : null;

  return (
    <div style={{ width: "100%", padding: "24px 32px", boxSizing: "border-box" }}>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Photo Upload & Detection
      </h2>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
        Upload a traffic photo — YOLO will detect vehicles, and AI will predict congestion levels
      </p>

      {/* ── TOP ROW — Upload + Button ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginBottom: 20 }}>

        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById("file-input").click()}
          style={{
            border: "2px dashed #d1d5db", borderRadius: 12, padding: "28px 20px",
            textAlign: "center", cursor: "pointer",
            background: file ? "#f9fafb" : "#fff", minHeight: 180,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center"
          }}
        >
          <input id="file-input" type="file" accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])} />
          {preview ? (
            <>
              <img src={preview} alt="preview"
                style={{ maxHeight: 160, maxWidth: "100%", borderRadius: 8, marginBottom: 8 }} />
              <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                {file.name}
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 40, margin: 0 }}>📷</p>
              <p style={{ fontWeight: 600, marginTop: 10, marginBottom: 4 }}>
                Drop a photo here or click to upload
              </p>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                JPG, PNG, WEBP supported
              </p>
            </>
          )}
        </div>

        {/* Right side — Button + Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <button
            onClick={handleSubmit} disabled={loading || !file}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
              background: loading || !file ? "#c7d2fe" : "#6366f1",
              color: "#fff", fontSize: 15, fontWeight: 600,
              cursor: loading || !file ? "not-allowed" : "pointer",
            }}>
            {loading ? "⏳ Detecting..." : "🔍 Detect & Predict"}
          </button>

          {/* How it works box */}
          <div style={{
            border: "1px solid #e5e7eb", borderRadius: 12,
            padding: "14px 16px", background: "#f8fafc", fontSize: 13
          }}>
            <p style={{ fontWeight: 600, marginBottom: 10, color: "#111827" }}>
              ⚙️ How it works
            </p>
            {[
              ["1️⃣", "Upload traffic photo here"],
              ["2️⃣", "YOLOv8s detects vehicles"],
              ["3️⃣", "Random Forest predicts congestion"],
              ["4️⃣", "View results and annotated image"],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: "flex", gap: 8, marginBottom: 8, color: "#374151" }}>
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fca5a5",
              borderRadius: 10, padding: "12px 14px", color: "#991b1b", fontSize: 13
            }}>⚠️ {error}</div>
          )}
        </div>
      </div>

      {/* ── RESULTS — 2 column layout ── */}
      {result && s && tip && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Prediction Card */}
            <div style={{
              background: s.bg, border: `1.5px solid ${s.border}`,
              borderRadius: 14, padding: "20px 24px",
            }}>
              <p style={{ fontSize: 13, color: s.text, margin: 0, fontWeight: 500 }}>
                Congestion Level
              </p>
              <p style={{ fontSize: 42, fontWeight: 700, color: s.text, margin: "6px 0 4px" }}>
                {s.emoji} {result.prediction}
              </p>
              <p style={{ fontSize: 13, color: s.text, margin: "0 0 16px" }}>
                {result.vehicle_count} vehicles detected · {result.confidence}% confidence
              </p>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8, fontSize: 13
              }}>
                {[
                  { label: "🟢 Low",    val: result.probabilities.low    },
                  { label: "🟡 Medium", val: result.probabilities.medium },
                  { label: "🔴 High",   val: result.probabilities.high   },
                ].map(({ label, val }) => (
                  <div key={label} style={{
                    background: "rgba(255,255,255,0.6)", borderRadius: 8,
                    padding: "8px", textAlign: "center"
                  }}>
                    <div style={{ fontWeight: 600, color: s.text }}>{val}%</div>
                    <div style={{ fontSize: 11, color: s.text, opacity: 0.8 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div style={{
              background: tip.bg, border: `1px solid ${tip.border}`,
              borderRadius: 12, padding: "16px 18px"
            }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: tip.text, marginBottom: 8 }}>
                📋 Recommendation
              </p>
              <p style={{ fontSize: 14, color: tip.text, margin: 0, lineHeight: 1.7 }}>
                {RECOMMENDATIONS[result.prediction]}
              </p>
            </div>

            {/* Vehicle Breakdown */}
            {Object.keys(result.vehicle_breakdown).length > 0 && (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: "#111827" }}>
                  🚗 Vehicle Breakdown
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {Object.entries(result.vehicle_breakdown).map(([type, count]) => {
                    const icons = { car: "🚗", bus: "🚌", truck: "🚛", motorcycle: "🏍️" };
                    return (
                      <div key={type} style={{
                        background: "#f3f4f6", borderRadius: 10,
                        padding: "10px 16px", textAlign: "center", minWidth: 70
                      }}>
                        <div style={{ fontSize: 22 }}>{icons[type] || "🚘"}</div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>{count}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{type}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Model Details */}
            <div style={{
              border: "1px solid #e5e7eb", borderRadius: 12,
              padding: "16px 18px", background: "#f8fafc"
            }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: "#111827" }}>
                🤖 Model Details
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                {[
                  ["Detection Model",  "YOLOv8s"],
                  ["Prediction Model", "Random Forest"],
                  ["Model Accuracy",   "100%"],
                  ["Vehicles Found",   result.vehicle_count],
                ].map(([label, val]) => (
                  <div key={label} style={{
                    background: "#fff", borderRadius: 8,
                    padding: "10px 12px", border: "1px solid #e5e7eb"
                  }}>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>{label}</div>
                    <div style={{
                      fontWeight: 600,
                      color: label === "Model Accuracy" ? "#166534" : "#111827"
                    }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN — Annotated Image */}
          {result.annotated_image && (
            <div style={{
              border: "1px solid #e5e7eb", borderRadius: 12,
              overflow: "hidden", height: "fit-content"
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "12px 16px",
                borderBottom: "1px solid #f3f4f6"
              }}>
                <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>
                  🖼️ Detection Result
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Annotated", "Original"].map((lbl) => (
                    <button key={lbl}
                      onClick={() => setShowAnnotated(lbl === "Annotated")}
                      style={{
                        padding: "4px 14px", borderRadius: 6,
                        border: "1px solid #d1d5db", fontSize: 12, cursor: "pointer",
                        background: (lbl === "Annotated") === showAnnotated ? "#6366f1" : "transparent",
                        color:      (lbl === "Annotated") === showAnnotated ? "#fff"    : "#374151",
                      }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <img
                src={showAnnotated
                  ? `data:image/jpeg;base64,${result.annotated_image}`
                  : preview}
                alt="detection result"
                style={{ width: "100%", display: "block" }}
              />

              {/* Legend */}
              <div style={{
                padding: "10px 16px", background: "#f9fafb",
                borderTop: "1px solid #f3f4f6",
                display: "flex", gap: 16, fontSize: 12, color: "#6b7280",
                flexWrap: "wrap"
              }}>
                <span>🔵 Car</span>
                <span>🟠 Bus</span>
                <span>🔴 Truck</span>
                <span>🟣 Motorcycle</span>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}