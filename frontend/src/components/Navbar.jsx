import React from "react";

const Navbar = ({ user, onLogout }) => {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        🏢 Employee Leave Management System
      </div>
      <div className="navbar-user">
        <span className="user-badge">
          {user?.role === "admin" ? "👑 Admin" : `👤 ${user?.name || "Employee"}`}
        </span>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
