import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Pages
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
    return saved ? JSON.parse(saved) : null;
  });

  const [authView, setAuthView] = useState("login"); // 'login', 'register', 'verify', 'forgot'
  const [verifyEmail, setVerifyEmail] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (user) {
      localStorage.setItem("leave_user", JSON.stringify(user));
      if (user.role === "admin") {
        setActiveTab("admin-dashboard");
      } else {
        setActiveTab("dashboard");
      }
    } else {
      localStorage.removeItem("leave_user");
    }
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setAuthView("login");
  };

  const handleNavigateToVerify = (email) => {
    setVerifyEmail(email);
    setAuthView("verify");
  };

  // Render Unauthenticated Auth Flow
  if (!user) {
    if (authView === "register") {
      return (
        <Register
          onNavigateToVerify={handleNavigateToVerify}
          onNavigateToLogin={() => setAuthView("login")}
        />
      );
    }

    if (authView === "verify") {
      return (
        <VerifyOTP
          email={verifyEmail}
          onNavigateToLogin={() => setAuthView("login")}
        />
      );
    }

    if (authView === "forgot") {
      return (
        <ForgotPassword
          onNavigateToLogin={() => setAuthView("login")}
        />
      );
    }

    // Default: Login View
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => setAuthView("register")}
        onNavigateToForgot={() => setAuthView("forgot")}
        onNavigateToVerify={handleNavigateToVerify}
      />
    );
  }

  // Render Authenticated Main Application Flow
  return (
    <div className="app-container">
      <Navbar user={user} onLogout={handleLogout} />
      
      <div className="main-layout">
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
        />

        <main className="content-area">
          {/* EMPLOYEE VIEWS */}
          {user.role === "employee" && (
            <>
              {activeTab === "dashboard" && (
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
                <Profile user={user} onUpdateUser={(updated) => setUser(updated)} />
              )}
            </>
          )}

          {/* ADMIN VIEWS */}
          {user.role === "admin" && (
            <>
              {activeTab === "admin-dashboard" && (
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
