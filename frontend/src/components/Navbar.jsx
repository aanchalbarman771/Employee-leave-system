import React from "react";

const Navbar = ({ user, activeTabTitle, onLogout, onToggleMobile }) => {
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="mobile-toggle-btn" onClick={onToggleMobile} title="Toggle Navigation Menu">
          ☰
        </button>
        <div className="navbar-page-title">
          🏢 Employee Leave Management System
        </div>
      </div>

      <div className="navbar-user">
        <div className="user-profile-chip">
          <div className="avatar-circle">
            {getInitial(user?.name)}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || "System User"}</span>
            <span className="user-role-badge">
              {user?.role === "admin" ? "👑 System Admin" : "👤 Employee"}
            </span>
          </div>
        </div>

        <button className="logout-btn" onClick={onLogout} title="Logout">
          Logout 🚪
        </button>
      </div>
    </header>
  );
};

export default Navbar;
