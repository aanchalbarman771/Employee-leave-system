import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";
import ForgotPassword from "./pages/ForgotPassword";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ApplyLeave from "./pages/ApplyLeave";
import MyLeaves from "./pages/MyLeaves";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import LeaveRequests from "./pages/LeaveRequests";
import Employees from "./pages/Employees";
import LeaveTypes from "./pages/LeaveTypes";

import "./App.css";
import "./Login.css";
import "./Dashboard.css";
import "./Form.css";
import "./Table.css";

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("leave_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed ? { ...parsed, role: (parsed.role || "employee").toLowerCase() } : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [authView, setAuthView] = useState("home"); // 'home', 'login', 'register', 'verify', 'forgot'
  const [verifyEmail, setVerifyEmail] = useState("");
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem("leave_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return (parsed.role || "").toLowerCase() === "admin" ? "admin-dashboard" : "dashboard";
      } catch (e) {}
    }
    return "dashboard";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem("leave_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("leave_user");
    }
  }, [user]);

  const handleLoginSuccess = (userData) => {
    if (!userData) return;
    const role = (userData.role || "employee").toLowerCase();
    const formattedUser = { ...userData, role };
    const defaultTab = role === "admin" ? "admin-dashboard" : "dashboard";
    setActiveTab(defaultTab);
    setUser(formattedUser);
  };

  const handleLogout = () => {
    setUser(null);
    setAuthView("home");
    setMobileOpen(false);
  };

  const handleNavigateToVerify = (email) => {
    setVerifyEmail(email);
    setAuthView("verify");
  };

  // Render Unauthenticated Auth Flow
  if (!user) {
    if (authView === "home") {
      return (
        <Home
          onNavigateToLogin={() => setAuthView("login")}
          onNavigateToRegister={() => setAuthView("register")}
        />
      );
    }

    if (authView === "register") {
      return (
        <Register
          onNavigateToLogin={() => setAuthView("login")}
          onNavigateToHome={() => setAuthView("home")}
          onNavigateToVerify={handleNavigateToVerify}
        />
      );
    }

    if (authView === "verify") {
      return (
        <VerifyOTP
          email={verifyEmail}
          onLoginSuccess={handleLoginSuccess}
          onNavigateToLogin={() => setAuthView("login")}
          onNavigateToHome={() => setAuthView("home")}
        />
      );
    }

    if (authView === "forgot") {
      return (
        <ForgotPassword
          onNavigateToLogin={() => setAuthView("login")}
          onNavigateToHome={() => setAuthView("home")}
          onNavigateToVerify={handleNavigateToVerify}
        />
      );
    }

    // Default: Login View (authView === "login")
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => setAuthView("register")}
        onNavigateToForgot={() => setAuthView("forgot")}
        onNavigateToHome={() => setAuthView("home")}
        onNavigateToVerify={handleNavigateToVerify}
      />
    );
  }

  const userRole = (user.role || "employee").toLowerCase();

  // Render Authenticated Main Application Flow
  return (
    <div className="app-container">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onToggleMobile={() => setMobileOpen(!mobileOpen)}
      />

      <div className="main-layout">
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <main className="content-area">
          {/* EMPLOYEE VIEWS */}
          {userRole === "employee" && (
            <>
              {(activeTab === "dashboard" || !["apply-leave", "my-leaves", "profile"].includes(activeTab)) && (
                <EmployeeDashboard
                  user={user}
                  onApplyLeaveClick={() => setActiveTab("apply-leave")}
                />
              )}
              {activeTab === "apply-leave" && (
                <ApplyLeave
                  user={user}
                  onSuccessRedirect={() => setActiveTab("my-leaves")}
                />
              )}
              {activeTab === "my-leaves" && <MyLeaves user={user} />}
              {activeTab === "profile" && (
                <Profile user={user} onUpdateUser={(updated) => setUser({ ...updated, role: (updated.role || "employee").toLowerCase() })} />
              )}
            </>
          )}

          {/* ADMIN VIEWS */}
          {userRole === "admin" && (
            <>
              {(activeTab === "admin-dashboard" || !["leave-requests", "employees", "leave-types"].includes(activeTab)) && (
                <AdminDashboard
                  onViewAllRequestsClick={() => setActiveTab("leave-requests")}
                />
              )}
              {activeTab === "leave-requests" && <LeaveRequests />}
              {activeTab === "employees" && <Employees />}
              {activeTab === "leave-types" && <LeaveTypes />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
