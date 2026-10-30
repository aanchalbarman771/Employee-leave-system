import React, { useState } from "react";

const Login = ({ onLoginSuccess, onNavigateToRegister, onNavigateToForgot, onNavigateToVerify }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!email || !password) {
      setMessage({ type: "danger", text: "Please fill all required fields." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresOTP) {
          setMessage({ type: "warning", text: "Email not verified. Redirecting to OTP verification..." });
          setTimeout(() => {
            onNavigateToVerify(email);
          }, 1500);
        } else {
          setMessage({ type: "danger", text: data.message || "Invalid email or password." });
        }
      } else {
        setMessage({ type: "success", text: "Login successful!" });
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 500);
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to backend server. Make sure server is running." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Login to Employee Leave Management System</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              placeholder="e.g. rahul@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label>Password *</label>
              <span className="auth-link" style={{ fontSize: "0.8rem" }} onClick={onNavigateToForgot}>
                Forgot Password?
              </span>
            </div>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="eye-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide Password" : "Show Password"}
                style={{ opacity: showPassword ? 1 : 0.4 }}
              >
                👁️
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <span className="auth-link" onClick={onNavigateToRegister}>
            Register here
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
