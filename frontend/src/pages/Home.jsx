import React from "react";
import "../Home.css";

const Home = ({ onNavigateToLogin, onNavigateToRegister }) => {
  return (
    <div className="sober-home">
      {/* 1. Header Bar */}
      <header className="sober-header">
        <div className="sober-brand">
          <div className="sober-brand-icon">🏛️</div>
          <span className="sober-brand-name">Employee Leave Management System</span>
        </div>

        <div className="sober-nav-actions">
          <button className="btn-sober-login" onClick={onNavigateToLogin}>
            Sign In
          </button>
          <button className="btn-sober-register" onClick={onNavigateToRegister}>
            Register
          </button>
        </div>
      </header>

      {/* 2. Main Hero Section */}
      <main className="sober-main">
        <div className="sober-badge">Workplace Leave Portal</div>

        <h1 className="sober-title">
          Smart & Seamless
          <br />
          Leave Management
        </h1>

        <p className="sober-desc">
          An efficient digital platform designed to simplify employee leave requests, track leave balances, and streamline approval processes for better workplace management.
        </p>

        {/* 3 Simple Feature Cards */}
        <div className="sober-cards-grid">
          <div className="sober-card">
            <span className="sober-card-icon">📝</span>
            <h3>Easy Leave Request</h3>
            <p>Select leave type, pick dates, and submit your request in just a few clicks.</p>
          </div>

          <div className="sober-card">
            <span className="sober-card-icon">📊</span>
            <h3>Real-Time Balance</h3>
            <p>Track your total 24 leaves, approved leaves, and pending requests anytime.</p>
          </div>

          <div className="sober-card">
            <span className="sober-card-icon">🔐</span>
            <h3>Secure OTP Access</h3>
            <p>Protected sign-in with 6-digit verification code delivered directly to your email.</p>
          </div>
        </div>
      </main>

      {/* 4. Minimal Footer */}
      <footer className="sober-footer">
        <div>&copy; 2026 Employee Leave Management System. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default Home;

