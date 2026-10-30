import React from "react";

const Sidebar = ({ user, activeTab, setActiveTab, onLogout, mobileOpen, onCloseMobile }) => {
  const isAdmin = user?.role === "admin";

  const employeeMenu = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "apply-leave", label: "📝 Apply Leave" },
    { id: "my-leaves", label: "📋 My Leaves" },
    { id: "profile", label: "👤 Profile" }
  ];

  const adminMenu = [
    { id: "admin-dashboard", label: "📊 Admin Dashboard" },
    { id: "leave-requests", label: "✉️ Leave Requests" },
    { id: "employees", label: "👥 Employees" },
    { id: "leave-types", label: "⚙️ Leave Types" }
  ];

  const menuItems = isAdmin ? adminMenu : employeeMenu;

  const handleSelectTab = (id) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={onCloseMobile} />
      )}

      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        {/* ELMS Branding Logo Header */}
        <div className="sidebar-brand">
          <div className="brand-icon">🏛️</div>
          <div className="brand-info">
            <span className="brand-title">ELMS</span>
            <span className="brand-subtitle">Leave Management System</span>
          </div>
        </div>

        <div className="sidebar-section-label">
          {isAdmin ? "Admin Navigation" : "Employee Portal"}
        </div>

        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => handleSelectTab(item.id)}
          >
            {item.label}
          </div>
        ))}

        <div
          className="sidebar-item"
          style={{ marginTop: "auto", color: "#F9EBEA" }}
          onClick={onLogout}
        >
          🚪 Logout
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
