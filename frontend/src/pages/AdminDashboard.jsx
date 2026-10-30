import React, { useState, useEffect } from "react";
import DashboardCard from "../components/DashboardCard";
import StatusBadge from "../components/StatusBadge";

const AdminDashboard = ({ onViewAllRequestsClick }) => {
  const [employeesCount, setEmployeesCount] = useState(0);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch employees count
      const empRes = await fetch("/api/employees");
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployeesCount(empData.length);
      }

      // Fetch leave requests
      const leaveRes = await fetch("/api/leaves");
      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        setLeaves(leaveData);
      }
    } catch (err) {
      console.error("Error fetching admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalRequests = leaves.length;
  const pendingRequests = leaves.filter(l => l.status === "Pending").length;
  const approvedLeaves = leaves.filter(l => l.status === "Approved").length;
  const rejectedLeaves = leaves.filter(l => l.status === "Rejected").length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Overview of system employees and leave applications</p>
      </div>

      {/* 5 Admin Dashboard Cards */}
      <div className="dashboard-grid">
        <DashboardCard
          title="Total Employees"
          value={employeesCount}
          colorClass="card-blue"
          icon="👥"
        />
        <DashboardCard
          title="Total Leave Requests"
          value={totalRequests}
          colorClass="card-purple"
          icon="📋"
        />
        <DashboardCard
          title="Pending Requests"
          value={pendingRequests}
          colorClass="card-amber"
          icon="⏳"
        />
        <DashboardCard
          title="Approved Leaves"
          value={approvedLeaves}
          colorClass="card-green"
          icon="✅"
        />
        <DashboardCard
          title="Rejected Leaves"
          value={rejectedLeaves}
          colorClass="card-red"
          icon="❌"
        />
      </div>

      {/* Recent Leave Requests */}
      <div className="table-container">
        <div className="table-toolbar">
          <h2 className="section-title" style={{ margin: 0 }}>Recent Employee Leave Requests</h2>
          <button className="btn-sm btn-edit" onClick={onViewAllRequestsClick}>
            View All Requests
          </button>
        </div>

        {loading ? (
          <p style={{ padding: "20px" }}>Loading data...</p>
        ) : leaves.length === 0 ? (
          <p style={{ padding: "20px", color: "var(--text-muted)" }}>No leave applications found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.slice(0, 5).map((item) => (
                <tr key={item._id}>
                  <td><strong>{item.employeeName}</strong></td>
                  <td>{item.employeeId}</td>
                  <td>{item.leaveType}</td>
                  <td>{item.fromDate}</td>
                  <td>{item.toDate}</td>
                  <td>{item.numberOfDays}</td>
                  <td><StatusBadge status={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
