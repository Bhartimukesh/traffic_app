import { useState } from "react";
import api from "../api/axios";

export default function LoginPage({ onLogin }) {
  const [mode, setMode]         = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);

  const reset = () => {
    setUsername(""); setEmail("");
    setPassword(""); setConfirm("");
    setError(""); setSuccess("");
  };

  const switchMode = (m) => { setMode(m); reset(); };

  const handleSubmit = async () => {
    setError(""); setSuccess("");

    if (mode === "register") {
      if (!username || !email || !password || !confirm)
        return setError("Sab fields bharo!");
      if (password !== confirm)
        return setError("Passwords match nahi kar rahe!");
      if (password.length < 6)
        return setError("Password kam se kam 6 characters ka hona chahiye!");

      setLoading(true);
      try {
        const res = await api.post("/register", { username, email, password });
        if (res.data.success) {
          setSuccess("Account ban gaya! Ab login karo.");
          setTimeout(() => switchMode("login"), 1500);
        } else {
          setError(res.data.message);
        }
      } catch {
        setError("Server se connect nahi hua!");
      }
      setLoading(false);

    } else {
      if (!username || !password)
        return setError("Username aur password dono bharo!");

      setLoading(true);
      try {
        const res = await api.post("/login", { username, password });
        if (res.data.success) {
          onLogin(res.data.user);
        } else {
          setError(res.data.message);
        }
      } catch {
        setError("Server se connect nahi hua! Flask chalao.");
      }
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: "1.5px solid #d1d5db", fontSize: 14,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "sans-serif", padding: 16
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "40px 36px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 44, margin: 0 }}>🚦</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "8px 0 4px" }}>
            Traffic Congestion Predictor
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            {mode === "login" ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        {/* Toggle tabs */}
        <div style={{
          display: "flex", background: "#f3f4f6",
          borderRadius: 10, padding: 4, marginBottom: 24
        }}>
          {["login", "register"].map((m) => (
            <button key={m} onClick={() => switchMode(m)} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
              fontWeight: 600, fontSize: 14, cursor: "pointer",
              background: mode === m ? "#fff"    : "transparent",
              color:      mode === m ? "#6366f1" : "#6b7280",
              boxShadow:  mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all .2s"
            }}>
              {m === "login" ? "🔑 Login" : "📝 Register"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 5 }}>
              Username
            </label>
            <input
              type="text" placeholder="apna username likho"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "#6366f1"}
              onBlur={(e)  => e.target.style.borderColor = "#d1d5db"}
            />
          </div>

          {mode === "register" && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 5 }}>
                Email
              </label>
              <input
                type="email" placeholder="apna email likho"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                onBlur={(e)  => e.target.style.borderColor = "#d1d5db"}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 5 }}>
              Password
            </label>
            <input
              type="password" placeholder="password likho (min 6 characters)"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "#6366f1"}
              onBlur={(e)  => e.target.style.borderColor = "#d1d5db"}
            />
          </div>

          {mode === "register" && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 5 }}>
                Confirm Password
              </label>
              <input
                type="password" placeholder="password dobara likho"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                onBlur={(e)  => e.target.style.borderColor = "#d1d5db"}
              />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fca5a5",
            borderRadius: 8, padding: "10px 14px",
            color: "#991b1b", fontSize: 13, marginTop: 14
          }}>⚠️ {error}</div>
        )}

        {/* Success */}
        {success && (
          <div style={{
            background: "#f0fdf4", border: "1px solid #86efac",
            borderRadius: 8, padding: "10px 14px",
            color: "#166534", fontSize: 13, marginTop: 14
          }}>✅ {success}</div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit} disabled={loading}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 10,
            border: "none", marginTop: 20,
            background: loading ? "#a5b4fc" : "#6366f1",
            color: "#fff", fontSize: 15, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}>
          {loading
            ? "Please wait..."
            : mode === "login" ? "Sign In →" : "Create Account →"}
        </button>

        {/* Switch mode */}
        <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", marginTop: 16 }}>
          {mode === "login" ? "Account nahi hai? " : "Already account exit ? "}
          <span 
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            style={{ color: "#6366f1", fontWeight: 600, cursor: "pointer" }}>
            {mode === "login" ? "Register karo" : "Login karo"}
          </span>
        </p>

      </div>
    </div>
  );
}