import React, { useState, useEffect } from "react";

const VerifyOTP = ({ email: initialEmail, onLoginSuccess, onNavigateToLogin }) => {
  const [targetEmail, setTargetEmail] = useState(initialEmail || "");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setTargetEmail(initialEmail);
    }
  }, [initialEmail]);

  // 60-second cooldown timer for resending OTP
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!targetEmail) {
      setMessage({ type: "danger", text: "Please provide your registered email address." });
      return;
    }

    const cleanOtp = String(otp).trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setMessage({ type: "danger", text: "Please enter a valid 6-digit OTP code." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, otp: cleanOtp })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "danger",
          text: data.message || "Invalid or expired OTP code. Please try again."
        });
      } else {
        setMessage({
          type: "success",
          text: "🎉 OTP verified successfully! Logging you in..."
        });

        setTimeout(() => {
          if (data.user && onLoginSuccess) {
            onLoginSuccess(data.user);
          } else if (onNavigateToLogin) {
            onNavigateToLogin();
          }
        }, 1000);
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to backend server. Make sure server is running." });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!targetEmail) {
      setMessage({ type: "danger", text: "Please enter your email address to resend OTP." });
      return;
    }

    setMessage({ type: "info", text: "Sending a fresh 6-digit OTP code..." });
    setResending(true);

    try {
      const response = await fetch("/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: data.message || "A new 6-digit OTP code has been dispatched to your email."
        });
        setTimer(60);
        setCanResend(false);
      } else {
        setMessage({ type: "danger", text: data.message || "Failed to resend OTP code." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to backend server." });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card-single">
        <div className="auth-header center">
          <div className="otp-icon-wrapper">🔐</div>
          <h2>Email OTP Verification</h2>
          <p>
            Please enter the 6-digit verification code sent to:
            <br />
            <strong style={{ color: "var(--dark-brown)" }}>{targetEmail || "your email address"}</strong>
          </p>
        </div>

        {message.text && message.type !== "info" && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form className="auth-form" onSubmit={handleVerify}>
          <div className="form-group">
            <label>Confirm Email Address</label>
            <input
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="e.g. user@gmail.com"
              required
            />
          </div>

          <div className="form-group">
            <label>6-Digit OTP Security Code *</label>
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
              Code expires in 10 minutes. Check your inbox and spam folder.
            </small>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Verifying Code..." : "Verify OTP & Access Dashboard ➔"}
          </button>

          <div style={{ marginTop: "12px" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleResend}
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
          Entered the wrong email?{" "}
          <span className="auth-link" onClick={onNavigateToLogin}>
            Back to Sign In
          </span>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
