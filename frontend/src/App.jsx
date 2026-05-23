import { useState, useRef, useEffect } from "react";
import UploadPage from "./components/UploadPage";
import Dashboard  from "./components/Dashboard";
import LoginPage  from "./components/LoginPage";
import Footer from "./components/Footer";
import "./App.css";

export default function App() {
  const [page, setPage]             = useState("home");
  const [user, setUser]             = useState(null);
  const [dropdownOpen, setDropdown] = useState(false);
  const dropdownRef                 = useRef(null);

  const handleLogin  = (userData) => { setUser(userData); setPage("home"); };
  const handleLogout = () => { setUser(null); setPage("home"); setDropdown(false); };

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
            { id: "upload",    label: "Upload"    },
            { id: "dashboard", label: "Dashboard" },
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
                    <span className="dropdown-item-icon">📷</span> Upload Photo
                  </button>
                  <button className="dropdown-item"
                    onClick={() => { setPage("dashboard"); setDropdown(false); }}>
                    <span className="dropdown-item-icon">📊</span> Dashboard
                  </button>

                  <div className="dropdown-divider" />

                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <span className="dropdown-item-icon">🚪</span> Sign out
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
              🤖 AI Powered — YOLOv8s + Random Forest
            </div>
            <h1 className="home-title">
              Predict Traffic<br />
              <span>Congestion with AI</span>
            </h1>
            <p className="home-desc">
              Road ki photo upload karo — YOLO vehicles detect karega
              aur Random Forest real-time congestion level predict karega.
            </p>
            <div className="home-btns">
              <button className="home-btn-primary"
                onClick={() => setPage("upload")}>
                📷 Upload Photo
              </button>
              <button className="home-btn-secondary"
                onClick={() => setPage("dashboard")}>
                📊 View Dashboard
              </button>
            </div>
            <div className="home-stats">
              {[
                { value: "100%",    label: "Model Accuracy"   },
                { value: "YOLOv8s", label: "Detection Model"  },
                { value: "3000+",   label: "Training Samples" },
                { value: "3",       label: "Congestion Levels" },
              ].map(({ value, label }) => (
                <div className="home-stat" key={label}>
                  <div className="home-stat-value">{value}</div>
                  <div className="home-stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Features Section */}
          <div className="home-features">
            <h2 className="home-features-title">How It Works</h2>
            <p className="home-features-sub">
              3 simple steps mein congestion predict karo
            </p>
            <div className="features-grid">
              {[
                {
                  icon:  "📷",
                  title: "Upload Photo",
                  desc:  "Kisi bhi road ya highway ki photo upload karo. JPG, PNG, WEBP supported hai."
                },
                {
                  icon:  "🔍",
                  title: "YOLO Detection",
                  desc:  "YOLOv8s model photo mein cars, buses, trucks aur motorcycles detect karta hai."
                },
                {
                  icon:  "🤖",
                  title: "AI Prediction",
                  desc:  "Random Forest algorithm vehicle count se Low, Medium ya High congestion predict karta hai."
                },
                {
                  icon:  "📊",
                  title: "Analytics",
                  desc:  "Dashboard mein sabhi predictions ka history aur trends dekho."
                },
                {
                  icon:  "💾",
                  title: "Database",
                  desc:  "Har prediction SQLite database mein save hoti hai future reference ke liye."
                },
                {
                  icon:  "⚡",
                  title: "Real-time",
                  desc:  "Fast processing — seconds mein accurate congestion prediction milti hai."
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
              Photo Upload &<br /><span>Detection</span>
            </h1>
            <p className="hero-desc">
              Traffic photo upload karo — AI vehicles detect karega aur congestion predict karega
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
          <div className="dashboard-banner">
            <h1>📊 Analytics Dashboard</h1>
            <p>Ab tak ki sabhi predictions ka overview aur trends</p>
          </div>
          <div className="page-content">
            <Dashboard />
          </div>
        </>
      )}

    </div>
  );
}