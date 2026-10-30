import React, { useState, useEffect } from "react";
import DashboardCard from "../components/DashboardCard";
import StatusBadge from "../components/StatusBadge";

const EmployeeDashboard = ({ user, onApplyLeaveClick }) => {
  const [employeeData, setEmployeeData] = useState(user);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch latest profile
      const profRes = await fetch(`/api/profile?employeeId=${user.employeeId}`);
      if (profRes.ok) {
        const profData = await profRes.json();
        setEmployeeData(profData);
      }

      // Fetch leaves
      const leaveRes = await fetch(`/api/leaves?employeeId=${user.employeeId}`);
      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        setLeaves(leaveData);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalLeave = employeeData?.totalLeave || 24;
  const usedLeave = employeeData?.usedLeave || 0;
  const remainingLeave = totalLeave - usedLeave;
  const pendingRequests = leaves.filter(l => l.status === "Pending").length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {employeeData?.name}!</h1>
        <p className="page-subtitle">Department: {employeeData?.department} | Designation: {employeeData?.designation}</p>
      </div>

      {/* Four Dashboard Cards */}
      <div className="dashboard-grid">
        <DashboardCard
          title="Total Leave"
          value={totalLeave}
          colorClass="card-blue"
          icon="📅"
        />
        <DashboardCard
          title="Used Leave"
          value={usedLeave}
          colorClass="card-amber"
          icon="⏳"
        />
        <DashboardCard
          title="Remaining Leave"
          value={remainingLeave}
          colorClass="card-green"
          icon="✅"
        />
        <DashboardCard
          title="Pending Requests"
          value={pendingRequests}
          colorClass="card-purple"
          icon="✉️"
        />
      </div>

      {/* Recent Leave Requests */}
      <div className="table-container">
        <div className="table-toolbar">
          <h2 className="section-title" style={{ margin: 0 }}>Recent Leave Applications</h2>
          <button className="btn-sm btn-edit" onClick={onApplyLeaveClick}>
            + Apply New Leave
          </button>
        </div>

        {loading ? (
          <p style={{ padding: "20px" }}>Loading leave history...</p>
        ) : leaves.length === 0 ? (
          <p style={{ padding: "20px", color: "var(--text-muted)" }}>No leave applications submitted yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>From Date</th>
                <th>To Date</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Admin Response</th>
              </tr>
            </thead>
            <tbody>
              {leaves.slice(0, 5).map((item) => (
                <tr key={item._id}>
                  <td><strong>{item.leaveType}</strong></td>
                  <td>{item.fromDate}</td>
                  <td>{item.toDate}</td>
                  <td>{item.numberOfDays}</td>
                  <td>{item.reason}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>{item.adminResponse || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
