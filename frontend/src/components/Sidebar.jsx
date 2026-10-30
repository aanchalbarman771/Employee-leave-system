import React from "react";

const Sidebar = ({ user, activeTab, setActiveTab, onLogout }) => {
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

  return (
    <aside className="sidebar">
      {menuItems.map((item) => (
        <div
          key={item.id}
          className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}
          onClick={() => setActiveTab(item.id)}
        >
          {item.label}
        </div>
      ))}
      <div className="sidebar-item" style={{ marginTop: "auto", color: "var(--danger)" }} onClick={onLogout}>
        🚪 Logout
      </div>
    </aside>
  );
};

export default Sidebar;
