import React, { useState, useEffect } from "react";

const Login = ({ onLoginSuccess, onNavigateToRegister, onNavigateToForgot, onNavigateToVerify }) => {
  // Step 1 = Enter Email & Password
  // Step 2 = Enter 6-digit Email Verification OTP
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "", isEmailNotFound: false, isWrongPass: false });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // 60-second cooldown timer for resending OTP
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Step 1: Submit Credentials & Request Email OTP
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "", isEmailNotFound: false, isWrongPass: false });

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setMessage({ type: "danger", text: "Please enter both email and password." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setMessage({ type: "danger", text: "Please enter a valid email address (e.g. name@gmail.com)." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // Specifically check if email was not found / wrong email
        const isNotFound = response.status === 404 || (data.message && data.message.toLowerCase().includes("not exist"));
        const isWrongPassword = data.field === "password" || (data.message && data.message.toLowerCase().includes("incorrect password"));

        setMessage({
          type: "danger",
          text: data.message || "Invalid email or password.",
          isEmailNotFound: isNotFound,
          isWrongPass: isWrongPassword
        });
      } else if (data.requiresOTP) {
        // Credentials verified! Move to Step 2 for OTP and clear info message
        setMessage({ type: "", text: "" });
        setStep(2);
        setTimer(60);
        setCanResend(false);
      } else if (data.user) {
        // Direct login if requiresOTP is false
        setMessage({
          type: "success",
          text: data.user.role === "admin"
            ? "Admin login successful! Redirecting..."
            : "Login successful! Redirecting to dashboard..."
        });
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 400);
      } else {
        setMessage({ type: "danger", text: "Login failed: User profile not returned." });
      }
    } catch (err) {
      setMessage({
        type: "danger",
        text: "Unable to connect to backend server. Make sure the backend server is running on port 5000."
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setMessage({ type: "danger", text: "Please enter the valid 6-digit OTP code sent to your email." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "danger",
          text: data.message || "Incorrect or expired OTP code. Please try again."
        });
      } else if (data.user) {
        setMessage({
          type: "success",
          text: "🎉 Email verified successfully! Logging you in..."
        });
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 500);
      } else {
        setMessage({ type: "danger", text: "Verification succeeded but user details are missing." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to backend server. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    const cleanEmail = email.trim().toLowerCase();
    setMessage({ type: "info", text: "Sending a fresh 6-digit OTP code to your email..." });
    setResending(true);

    try {
      const response = await fetch("/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: data.message || `A new OTP code has been dispatched to ${cleanEmail}.`
        });
        setTimer(60);
        setCanResend(false);
      } else {
        setMessage({ type: "danger", text: data.message || "Failed to resend OTP. Please try again." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to backend server." });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {step === 1 ? (
          <>
            <div className="auth-header center">
              <div className="auth-logo-badge">🏛️</div>
              <h2>Welcome Back</h2>
              <p>Login with your registered email & password</p>
            </div>

            {message.text && (
              <div className={`alert alert-${message.type}`}>
                <div>{message.text}</div>
                {message.isEmailNotFound && (
                  <div style={{ marginTop: "8px", fontSize: "0.85rem" }}>
                    👉 Wrong email or not registered?{" "}
                    <span
                      className="auth-link"
                      style={{ textDecoration: "underline", fontWeight: 700 }}
                      onClick={onNavigateToRegister}
                    >
                      Create an account here
                    </span>
                  </div>
                )}
                {message.isWrongPass && (
                  <div style={{ marginTop: "8px", fontSize: "0.85rem" }}>
                    👉 Forgot your password?{" "}
                    <span
                      className="auth-link"
                      style={{ textDecoration: "underline", fontWeight: 700 }}
                      onClick={onNavigateToForgot}
                    >
                      Reset password via OTP
                    </span>
                  </div>
                )}
              </div>
            )}

            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. rahul@gmail.com or aanchalbarman91@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label>Password *</label>
                  <span
                    className="auth-link"
                    style={{ fontSize: "0.82rem", fontWeight: 600 }}
                    onClick={onNavigateToForgot}
                  >
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
                  >
                    👁️
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Verifying Credentials..." : "Log In ➔"}
              </button>
            </form>

            <div className="auth-footer">
              Don't have an account?{" "}
              <span className="auth-link" onClick={onNavigateToRegister}>
                Register here
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="auth-header center">
              <div className="otp-icon-wrapper">🔐</div>
              <h2>Email OTP Verification</h2>
              <p>
                A 6-digit security code was sent to:
                <br />
                <strong style={{ color: "var(--dark-brown)", wordBreak: "break-all" }}>{email}</strong>
              </p>
            </div>

            {message.text && message.type !== "info" && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            <form className="auth-form" onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label>Enter 6-Digit OTP Code *</label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => {
                    const numericOnly = e.target.value.replace(/\D/g, "");
                    setOtp(numericOnly);
                  }}
                  className="otp-input-box"
                  required
                  autoFocus
                />
                <small style={{ color: "var(--text-muted)", fontSize: "0.82rem", display: "block", textAlign: "center", marginTop: "6px" }}>
                  Code is valid for 10 minutes. Check your inbox and spam folder.
                </small>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Verifying Code..." : "Verify OTP & Access Dashboard ➔"}
              </button>

              <div style={{ marginTop: "12px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleResendOTP}
                  disabled={resending || !canResend}
                >
                  {resending
                    ? "Sending new OTP..."
                    : canResend
                    ? "Resend 6-Digit OTP Code"
                    : `Resend OTP in ${timer}s`}
                </button>
              </div>
            </form>

            <div className="auth-footer">
              Entered wrong email?{" "}
              <span
                className="auth-link"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setMessage({ type: "", text: "" });
                }}
              >
                ← Back to Login
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
