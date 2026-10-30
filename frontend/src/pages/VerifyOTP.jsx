import React, { useState } from "react";

const VerifyOTP = ({ email, onNavigateToLogin }) => {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!otp || otp.length !== 6) {
      setMessage({ type: "danger", text: "OTP should contain 6 digits." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "danger", text: data.message || "Invalid OTP. Please try again." });
      } else {
        setMessage({ type: "success", text: "Email verified successfully. Redirecting to login..." });
        setTimeout(() => {
          onNavigateToLogin();
        }, 1500);
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to server." });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setMessage({ type: "info", text: "Sending new OTP..." });

    try {
      const response = await fetch("http://localhost:5000/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "New OTP has been sent to your email." });
      } else {
        setMessage({ type: "danger", text: data.message || "Failed to resend OTP." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to server." });
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Verify Your Email</h2>
          <p>Enter the 6-digit OTP sent to <strong>{email}</strong></p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form className="auth-form" onSubmit={handleVerify}>
          <div className="form-group">
            <label>6-Digit OTP *</label>
            <input
              type="text"
              maxLength="6"
              placeholder="e.g. 123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{ letterSpacing: "4px", fontSize: "1.2rem", textAlign: "center" }}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <button type="button" className="btn-secondary" onClick={handleResend}>
            Resend OTP
          </button>
        </form>

        <div className="auth-footer">
          Back to{" "}
          <span className="auth-link" onClick={onNavigateToLogin}>
            Login
          </span>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
