import { useState } from "react";
import api from "../api/axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

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

const COLOR = { Low: "#22c55e", Medium: "#eab308", High: "#ef4444" };

export default function VideoPage() {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [progress, setProgress] = useState("");

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
    if (f && f.type.startsWith("video/")) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return setError("Please select a video first.");
    setLoading(true);
    setError("");
    setProgress("Video upload ho rahi hai...");

    const form = new FormData();
    form.append("file", file);

    try {
      setProgress("Frames analyze ho rahe hain... (thoda time lagega)");
      const res = await api.post("/detect-video", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000  // 5 min timeout
      });
      setResult(res.data);
      setProgress("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to connect to the backend. Please run the Flask server.");
      setProgress("");
    }
    setLoading(false);
  };

  const s   = result ? LEVEL_STYLE[result.prediction] : null;
  const tip = result ? TIPS[result.prediction]        : null;

  return (
    <div className="video-page">

      <h2 className="video-page-title">Video Upload & Analysis</h2>
      <p className="video-page-desc">
        Upload a traffic video — AI will analyze each frame and predict overall congestion levels
      </p>

      {/* Upload + Button Row */}
      <div className="video-top-row">

        {/* Drop Zone */}
        <div
          className="video-drop-zone"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById("video-input").click()}
        >
          <input
            id="video-input" type="file"
            accept="video/mp4,video/avi,video/mov,video/mkv,video/webm"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {preview ? (
            <>
              <video
                src={preview} controls
                className="video-preview"
              />
              <p className="video-filename">{file.name}</p>
            </>
          ) : (
            <>
              <p className="video-drop-icon">🎥</p>
              <p className="video-drop-text">Drop a video here or click to upload</p>
              <p className="video-drop-sub">MP4, AVI, MOV, MKV, WEBM supported</p>
            </>
          )}
        </div>

        {/* Right side */}
        <div className="video-right">
          <button
            onClick={handleSubmit}
            disabled={loading || !file}
            className={`video-submit-btn ${loading || !file ? "disabled" : ""}`}
          >
            {loading ? "⏳ Analyzing..." : "🎬 Analyze Video"}
          </button>

          {/* Progress */}
          {progress && (
            <div className="video-progress">
              <div className="video-progress-spinner" />
              <p>{progress}</p>
            </div>
          )}

          {/* How it works */}
          <div className="video-howto">
            <p className="video-howto-title">⚙️ How it works</p>
            {[
              ["1️⃣", "Upload a traffic video"],
              ["2️⃣", "AI analyzes each frame"],
              ["3️⃣", "YOLOv8s detects vehicles"],
              ["4️⃣", "Predicts overall congestion levels"],
            ].map(([icon, text]) => (
              <div className="video-howto-item" key={text}>
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && <div className="video-error">⚠️ {error}</div>}
        </div>
      </div>

      {/* Results */}
      {result && s && tip && (
        <div className="video-results">

          {/* Stats Row */}
          <div className="video-stats-row">
            {[
              { label: "Video Duration",   value: `${result.video_duration}s` },
              { label: "Frames Analyzed",  value: result.frames_analyzed      },
              { label: "Avg Vehicles",     value: result.avg_vehicle_count    },
              { label: "Max Vehicles",     value: result.max_vehicle_count    },
            ].map(({ label, value }) => (
              <div className="video-stat-card" key={label}>
                <div className="video-stat-value">{value}</div>
                <div className="video-stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Prediction + Chart */}
          <div className="video-result-grid">

            {/* Left — Prediction */}
            <div className="video-result-left">

              {/* Prediction Card */}
              <div className="video-pred-card" style={{
                background: s.bg, border: `1.5px solid ${s.border}`
              }}>
                <p className="video-pred-label" style={{ color: s.text }}>
                  Congestion Level
                </p>
                <p className="video-pred-value" style={{ color: s.text }}>
                  {s.emoji} {result.prediction}
                </p>
                <p className="video-pred-meta" style={{ color: s.text }}>
                  Avg {result.avg_vehicle_count} vehicles · {result.confidence}% confidence
                </p>
                <div className="video-pred-probs">
                  {[
                    { label: "🟢 Low",    val: result.probabilities.low    },
                    { label: "🟡 Medium", val: result.probabilities.medium },
                    { label: "🔴 High",   val: result.probabilities.high   },
                  ].map(({ label, val }) => (
                    <div className="video-prob-box" key={label}
                      style={{ background: "rgba(255,255,255,0.6)" }}>
                      <div style={{ fontWeight: 700, color: s.text }}>{val}%</div>
                      <div style={{ fontSize: 11, color: s.text }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div className="video-rec-box" style={{
                background: tip.bg, border: `1px solid ${tip.border}`
              }}>
                <p className="video-rec-title" style={{ color: tip.text }}>
                  📋 Recommendation
                </p>
                <p className="video-rec-text" style={{ color: tip.text }}>
                  {RECOMMENDATIONS[result.prediction]}
                </p>
              </div>

            </div>

            {/* Right — Frame Chart */}
            <div className="video-chart-box">
              <p className="video-chart-title">
                📈 Vehicle Count Per Frame
              </p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={result.frame_results}>
                  <XAxis
                    dataKey="time_sec"
                    tickFormatter={(v) => `${v}s`}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => [v, "Vehicles"]}
                    labelFormatter={(l) => `Time: ${l}s`}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {result.frame_results.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.count >= 25 ? "#ef4444" :
                          entry.count >= 12 ? "#eab308" : "#22c55e"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="video-chart-legend">
                🟢 Low &nbsp; 🟡 Medium &nbsp; 🔴 High
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}