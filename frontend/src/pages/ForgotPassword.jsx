import React, { useState } from "react";

const ForgotPassword = ({ onNavigateToLogin }) => {
  const [step, setStep] = useState(1); // Step 1: Send OTP, Step 2: Enter OTP & New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });
        setStep(2);
      } else {
        setMessage({ type: "danger", text: data.message });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to server." });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });
        setTimeout(() => {
          onNavigateToLogin();
        }, 1500);
      } else {
        setMessage({ type: "danger", text: data.message });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Forgot Password</h2>
          <p>{step === 1 ? "Enter your email to receive an OTP" : "Enter OTP and your new password"}</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {step === 1 ? (
          <form className="auth-form" onSubmit={handleSendOTP}>
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
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>6-Digit OTP *</label>
              <input
                type="text"
                maxLength="6"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>New Password *</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="auth-footer">
          Remember your password?{" "}
          <span className="auth-link" onClick={onNavigateToLogin}>
            Login here
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
