import { useState, useRef, useEffect } from "react";
import UploadPage from "./components/UploadPage";
import Dashboard  from "./components/Dashboard";
import LoginPage  from "./components/LoginPage";
import Footer from "./components/Footer";
import "./App.css";
import VideoPage from "./components/VideoPage";
import EmergencyDashboard from "./components/EmergencyDashboard";
import SignalTimingPage from "./components/SignalTimingPage";
import InteractiveMap from "./components/InteractiveMap";
import AccidentDetection from "./components/AccidentDetection";

export default function App() {
  const [page, setPage]             = useState("home");
  const [user, setUser] = useState(() => {
  const saved = localStorage.getItem("traffic_user");
  return saved ? JSON.parse(saved) : null;
});
  const [dropdownOpen, setDropdown] = useState(false);
  const dropdownRef                 = useRef(null);

const handleLogin  = (userData) => { 
  setUser(userData); 
  localStorage.setItem("traffic_user", JSON.stringify(userData));
  setPage("home"); 
};
const handleLogout = () => { 
  setUser(null); 
  localStorage.removeItem("traffic_user");
  setPage("home"); 
  setDropdown(false); 
};

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div>

      {/* ── NAVBAR ── */}
      <nav className="navbar">

        {/* Logo */}
        <div className="navbar-logo" onClick={() => setPage("home")}>
          <span className="navbar-logo-icon">🚦</span>
          <div className="navbar-logo-title">
            Traffic<span>AI</span>
          </div>
        </div>

        {/* Center Links */}
        <div className="navbar-links">
          {[
            { id: "home",      label: "Home"      },
            { id: "upload",    label: "Image  Upload"    },
            { id: "video", label: "Video" },
            { id: "dashboard", label: "Dashboard" },
            { id: "signal", label: "🚦 Signal" },
            { id: "emergency", label: "🚨 Emergency" },
            { id: "imap", label: "🗺️ Live Map" },
            { id: "accident", label: "💥 Accident" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`nav-btn ${page === id ? "active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right — Avatar Dropdown */}
        <div className="navbar-right">
          <div className="user-dropdown-wrapper" ref={dropdownRef}>
            <button
              className="user-avatar-btn"
              onClick={() => setDropdown(!dropdownOpen)}
            >
              {user.username[0].toUpperCase()}
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="dropdown-name">{user.username}</div>
                    <div className="dropdown-email">{user.email}</div>
                  </div>
                </div>

                <div style={{ padding: "6px 0" }}>
                  <button className="dropdown-item"
                    onClick={() => { setPage("home"); setDropdown(false); }}>
                    <span className="dropdown-item-icon">🏠</span> Home
                  </button>
                  <button className="dropdown-item"
                    onClick={() => { setPage("upload"); setDropdown(false); }}>
                    <span className="dropdown-item-icon">📷</span> ImageUpload
                  </button>
                  <button className="dropdown-item"
                    onClick={() => { setPage("dashboard"); setDropdown(false); }}>
                    <span className="dropdown-item-icon">📊</span> Dashboard
                  </button>
                   <button className="dropdown-item"
                        onClick={() => { setPage("video"); setDropdown(false); }}>
                     <span className="dropdown-item-icon">🎥</span> Video Analysis
                  </button>
                  <button className="dropdown-item"
                            onClick={() => { setPage("emergency"); setDropdown(false); }}>
                      <span className="dropdown-item-icon">🚨</span> Emergency System
                   </button>
                  <div className="dropdown-divider" />

                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <span className="dropdown-item-icon">🚪</span> Sign out
                  </button>
                  <button className="dropdown-item"
                      onClick={() => { setPage("signal"); setDropdown(false); }}>
                    <span className="dropdown-item-icon">🚦</span> Signal Timing
                       </button>

                </div>

                <div className="dropdown-footer">
                  Traffic Congestion Predictor v1.0
                </div>
              </div>
            )}
          </div>
        </div>

      </nav>

      {/* ── HOME PAGE ── */}
      {page === "home" && (
        <>
          {/* Hero Section */}
          <div className="home-hero">
            <div className="home-badge">
               AI Powered — YOLOv8s + Random Forest
            </div>
            <h1 className="home-title">
              Predict Traffic<br />
              <span>Congestion with AI</span>
            </h1>
            <p className="home-desc">
            Upload traffic congestion images and videos — YOLO will detect vehicles, 
            and a Random Forest model will predict the traffic congestion level.
            </p>
<div className="home-btns">
  <button className="home-btn-primary"
    onClick={() => setPage("upload")}>
    📷 Upload Photo
  </button>
  <button className="home-btn-primary"
    onClick={() => setPage("video")}>
    🎥 Upload Video
  </button>
  <button className="home-btn-secondary"
    onClick={() => setPage("dashboard")}>
    📊 View Dashboard
  </button>
</div>
<div className="hero-stats" style={{ justifyContent: "center", width: "100%" }}>
  {[
    { value: "100%",    label: "Accuracy"         },
    { value: "YOLOv8s", label: "Detection Model"  },
    { value: "3000+",   label: "Training Samples" },
  ].map(({ value, label }) => (
    <div key={label} style={{ textAlign: "center" }}>
      <div className="hero-stat-value">{value}</div>
      <div className="hero-stat-label">{label}</div>
    </div>
  ))}
</div>
          </div>

          {/* Features Section */}
          <div className="home-features">
            <h2 className="home-features-title">How It Works</h2>
            <p className="home-features-sub">
              Simple steps for congestion prediction
            </p>
            <div className="features-grid">
              {[
                {
                  icon:  "📷",
                  title: "Upload Photo, Video",
                  desc:  "Upload any traffic photo and video from road or highway. JPG, PNG, WEBP formats are supported."
                },
                {
                  icon:  "🔍",
                  title: "YOLO Detection",
                  desc:  "YOLOv8s model detects cars, buses, trucks, and motorcycles in images and videos."
                },
                {
                  icon:  "🤖",
                  title: "AI Prediction",
                  desc:  "Random Forest algorithm predicts Low, Medium, or High congestion levels based on the vehicle count."
                },
                {
                  icon:  "📊",
                  title: "Analytics",
                  desc:  "View the history and trends of all predictions on the dashboard."
                },
                {
                  icon:  "💾",
                  title: "Database",
                  desc:  "All predictions are saved in a SQLite database for future reference."
                },
                {
                  icon:  "⚡",
                  title: "Real-time",
                  desc:  "Fast processing — get accurate congestion predictions within seconds."
                },
              ].map(({ icon, title, desc }) => (
                <div className="feature-card" key={title}>
                  <div className="feature-icon">{icon}</div>
                  <div className="feature-title">{title}</div>
                  <p className="feature-desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <Footer />
        </>
      )}

      {/* ── UPLOAD PAGE ── */}
      {page === "upload" && (
        <>
          <div className="hero-banner">
            <div className="hero-badge">🤖 YOLOv8s + Random Forest</div>
            <h1 className="hero-title">
              ImageUpload &<br /><span>Detection</span>
            </h1>
            <p className="hero-desc">
              Upload a traffic photo — AI will detect vehicles, and predict congestion levels
            </p>
            <div className="hero-stats">
              {[
                { value: "100%",    label: "Accuracy"         },
                { value: "YOLOv8s", label: "Detection Model"  },
                { value: "3000+",   label: "Training Samples" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="hero-stat-value">{value}</div>
                  <div className="hero-stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="page-content">
            <UploadPage />
          </div>
        </>
      )}

      {/* ── DASHBOARD PAGE ── */}
{page === "dashboard" && (
  <>
    <div className="hero-banner">
      <div className="hero-badge">📊 Real-time Analytics</div>
      <h1 className="hero-title">
        Analytics <span>Dashboard</span>
      </h1>
      <p className="hero-desc">
        View all your predictions in one place — stats, charts, and history
      </p>
    </div>
    <div className="page-content">
      <Dashboard />
    </div>
  </>
)}

      {/* ── VIDEO PAGE ── */}
{page === "video" && (
  <>
    <div className="hero-banner">
      <div className="hero-badge">🎥 Video Analysis</div>
      <h1 className="hero-title">
        Video Upload &<br /><span>Analysis</span>
      </h1>
      <p className="hero-desc">
        Upload a traffic video — AI will analyze each frame
      </p>
    </div>
    <div className="page-content">
      <VideoPage />
    </div>
  </>
)}
{page === "emergency" && (
  <>
    <div className="hero-banner" style={{
      background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)"
    }}>
      <div className="hero-badge">🚑 Life Safety System</div>
      <h1 className="hero-title">
        Ambulance Priority<br /><span>& Signal Control</span>
      </h1>
      <p className="hero-desc">
        Real-time emergency vehicle detection — Traffic signals automatically switch to GREEN mode to clear the route
      </p>
    </div>
    <div className="page-content">
      <EmergencyDashboard />
    </div>
  </>
)}

{page === "signal" && (
  <>
    <div className="hero-banner" style={{
      background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)"
    }}>
      <div className="hero-badge">🚦 Smart City Feature</div>
      <h1 className="hero-title">
        Dynamic Signal<br /><span>Timing System</span>
      </h1>
      <p className="hero-desc">
        AI-powered traffic signal timing optimization — Reduce congestion and improve traffic flow in real-time
      </p>
    </div>
    <div className="page-content">
      <SignalTimingPage />
    </div>
  </>
)}

{page === "imap" && (
  <>
    <div className="hero-banner">
      <div className="hero-badge">🗺️ OpenStreetMap + Leaflet</div>
      <h1 className="hero-title">
        Interactive Traffic<br /><span>Map View</span>
      </h1>
      <p className="hero-desc">
        Junction locations · Traffic status · Congestion hotspots — real-time color coded
      </p>
    </div>
    <div className="page-content">
      <InteractiveMap />
    </div>
  </>
)}

{page === "accident" && (
  <>
    <div className="hero-banner" style={{
      background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)"
    }}>
      <div className="hero-badge">🚗💥 AI Accident Detection</div>
      <h1 className="hero-title">
        Accident Detection<br /><span>& Alert System</span>
      </h1>
      <p className="hero-desc">
        YOLO se collision, overturned vehicle aur pile-up detect karo —
        real-time dashboard alerts
      </p>
    </div>
    <div className="page-content">
      <AccidentDetection />
    </div>
  </>
)}

    </div>
  );
}