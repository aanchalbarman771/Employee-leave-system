import React, { useState, useEffect } from "react";

const ForgotPassword = ({ onNavigateToLogin }) => {
  // Step 1 = Enter Email
  // Step 2 = Enter 6-digit OTP
  // Step 3 = Set New Password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Timer countdown for resending OTP
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

  // Step 1: Send Reset OTP to Email
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setMessage({ type: "danger", text: "Please enter your registered email address." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: data.message || "A 6-digit password reset OTP has been sent to your email inbox."
        });
        setStep(2);
        setTimer(60);
        setCanResend(false);
      } else {
        setMessage({ type: "danger", text: data.message || "No account found with this email." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to backend server. Make sure server is running on port 5000." });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP code
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const cleanOtp = String(otp).trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setMessage({ type: "danger", text: "Please enter the valid 6-digit OTP code." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: cleanOtp })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "OTP verified successfully! Please enter your new password below."
        });
        if (data.resetToken) {
          setResetToken(data.resetToken);
        }
        setStep(3); // Transition to Step 3: New Password Page
      } else {
        setMessage({ type: "danger", text: data.message || "Invalid or expired OTP code." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to backend server." });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOTP = async () => {
    setMessage({ type: "info", text: "Sending a new OTP code..." });
    setResending(true);

    try {
      const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "A fresh 6-digit OTP code has been dispatched to your email."
        });
        setTimer(60);
        setCanResend(false);
      } else {
        setMessage({ type: "danger", text: data.message || "Failed to resend OTP." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to backend server." });
    } finally {
      setResending(false);
    }
  };

  // Step 3: Save New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!newPassword || newPassword.length < 4) {
      setMessage({ type: "danger", text: "Password must be at least 4 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "danger", text: "New password and Confirm password must match." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          resetToken,
          otp: otp.trim(),
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "🎉 Password updated successfully! Redirecting to sign in..."
        });
        setTimeout(() => {
          onNavigateToLogin();
        }, 1200);
      } else {
        setMessage({ type: "danger", text: data.message || "Failed to update password." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to backend server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card-single">
        <div className="auth-header center">
          <div className="otp-icon-wrapper">
            {step === 1 ? "✉️" : step === 2 ? "🔐" : "🔑"}
          </div>
          <h2>
            {step === 1 && "Forgot Password"}
            {step === 2 && "Enter Verification OTP"}
            {step === 3 && "Set New Password"}
          </h2>
          <p>
            {step === 1 && "Enter your registered email address to receive a 6-digit OTP code"}
            {step === 2 && `Enter the 6-digit OTP verification code sent to ${email}`}
            {step === 3 && `Create a strong new password for ${email}`}
          </p>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="step-indicator" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "22px" }}>
          <span className={`step-dot ${step === 1 ? "active" : "completed"}`} style={{ fontWeight: step === 1 ? 700 : 500, fontSize: "0.82rem" }}>
            1. Email
          </span>
          <span className="step-divider" style={{ color: "var(--border)" }}>➔</span>
          <span className={`step-dot ${step === 2 ? "active" : step > 2 ? "completed" : ""}`} style={{ fontWeight: step === 2 ? 700 : 500, fontSize: "0.82rem" }}>
            2. OTP Verify
          </span>
          <span className="step-divider" style={{ color: "var(--border)" }}>➔</span>
          <span className={`step-dot ${step === 3 ? "active" : ""}`} style={{ fontWeight: step === 3 ? 700 : 500, fontSize: "0.82rem" }}>
            3. New Password
          </span>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* STEP 1: Enter Email Form */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleRequestOTP}>
            <div className="form-group">
              <label>Registered Email Address *</label>
              <input
                type="email"
                placeholder="e.g. user@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <small style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "4px", display: "block" }}>
                A 6-digit verification code will be dispatched to your email via Nodemailer.
              </small>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending OTP Code..." : "Send Verification OTP ➔"}
            </button>
          </form>
        )}

        {/* STEP 2: Enter OTP Form */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label>6-Digit OTP Security Code *</label>
              <input
                type="text"
                maxLength="6"
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="otp-input-box"
                required
                autoFocus
              />
              <small style={{ color: "var(--text-muted)", fontSize: "0.82rem", display: "block", textAlign: "center", marginTop: "6px" }}>
                Check your inbox and spam folder. Code expires in 10 minutes.
              </small>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Verifying Code..." : "Verify OTP & Continue ➔"}
            </button>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleResendOTP}
                disabled={resending || !canResend}
                style={{ flex: 1 }}
              >
                {resending ? "Sending..." : canResend ? "Resend OTP" : `Resend in ${timer}s`}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setMessage({ type: "", text: "" });
                }}
                style={{ flex: 1 }}
              >
                ← Change Email
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: New Password Form ("frr new password ka page aana chaiye") */}
        {step === 3 && (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>New Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password (min 4 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
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

            <div className="form-group">
              <label>Confirm New Password *</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Updating Password..." : "Save New Password & Sign In ➔"}
            </button>
          </form>
        )}

        <div className="auth-footer">
          Remember your password?{" "}
          <span className="auth-link" onClick={onNavigateToLogin}>
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
