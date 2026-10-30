import React, { useState, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";
import Pagination from "../components/Pagination";

const LeaveRequests = () => {
  const [allLeaves, setAllLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_LIMIT = 10;
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Modal State for optional Admin Response
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState(""); // "Approved" or "Rejected"
  const [adminResponseText, setAdminResponseText] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leavesRes, empRes] = await Promise.all([
        fetch("http://localhost:5000/api/leaves"),
        fetch("http://localhost:5000/api/employees")
      ]);

      if (leavesRes.ok) {
        const leavesData = await leavesRes.json();
        setAllLeaves(leavesData);
      }

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData);
      }
    } catch (err) {
      console.error("Error fetching leave requests data:", err);
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (leaveItem, action) => {
    setSelectedLeave(leaveItem);
    setActionType(action);
    setAdminResponseText(
      action === "Approved"
        ? "Your leave request has been approved."
        : "Sorry, your leave request is rejected."
    );
  };

  const closeActionModal = () => {
    setSelectedLeave(null);
    setActionType("");
    setAdminResponseText("");
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedLeave || !actionType) return;

    try {
      const res = await fetch("http://localhost:5000/api/leaves/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedLeave._id,
          status: actionType,
          adminResponse: adminResponseText
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        closeActionModal();
        fetchData();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "danger", text: data.message || "Failed to update leave request." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to server." });
    }
  };

  // Only display leave requests for employees that currently exist in the database
  const validEmployeeIds = new Set(employees.map((e) => e.employeeId));
  const activeLeaves = employees.length > 0
    ? allLeaves.filter((item) => validEmployeeIds.has(item.employeeId))
    : allLeaves;

  // Helper: calculate total approved days taken earlier across all leaves for an employee
  const getEmployeeApprovedDays = (empId, empName) => {
    return activeLeaves
      .filter((l) => {
        const matchesId = empId && l.employeeId && l.employeeId === empId;
        const matchesName = empName && l.employeeName && l.employeeName.toLowerCase() === empName.toLowerCase();
        return (matchesId || matchesName) && l.status === "Approved";
      })
      .reduce((sum, l) => sum + (Number(l.numberOfDays) || 0), 0);
  };

  // Helper: calculate total leaves applied by an employee
  const getEmployeeTotalAppliedCount = (empId, empName) => {
    return activeLeaves.filter((l) => {
      const matchesId = empId && l.employeeId && l.employeeId === empId;
      const matchesName = empName && l.employeeName && l.employeeName.toLowerCase() === empName.toLowerCase();
      return matchesId || matchesName;
    }).length;
  };

  // Client-side search & status filtering
  const cleanTerm = searchTerm.trim().toLowerCase();

  const filteredLeaves = activeLeaves.filter((item) => {
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesSearch =
      !cleanTerm ||
      (item.employeeName && item.employeeName.toLowerCase().includes(cleanTerm)) ||
      (item.employeeId && item.employeeId.toLowerCase().includes(cleanTerm)) ||
      (item.leaveType && item.leaveType.toLowerCase().includes(cleanTerm));

    return matchesStatus && matchesSearch;
  });

  // Calculate statistics for the currently searched employee across ALL leaves
  const searchedEmployeeLeaves = cleanTerm
    ? activeLeaves.filter((l) => {
        return (
          (l.employeeName && l.employeeName.toLowerCase().includes(cleanTerm)) ||
          (l.employeeId && l.employeeId.toLowerCase().includes(cleanTerm))
        );
      })
    : [];

  const searchedAppliedCount = searchedEmployeeLeaves.length;
  const searchedAppliedDays = searchedEmployeeLeaves.reduce((sum, l) => sum + (Number(l.numberOfDays) || 0), 0);
  const searchedApprovedLeaves = searchedEmployeeLeaves.filter((l) => l.status === "Approved");
  const searchedApprovedDays = searchedApprovedLeaves.reduce((sum, l) => sum + (Number(l.numberOfDays) || 0), 0);
  const searchedPendingLeaves = searchedEmployeeLeaves.filter((l) => l.status === "Pending");
  const searchedPendingDays = searchedPendingLeaves.reduce((sum, l) => sum + (Number(l.numberOfDays) || 0), 0);
  const searchedRejectedLeaves = searchedEmployeeLeaves.filter((l) => l.status === "Rejected");
  const searchedRejectedDays = searchedRejectedLeaves.reduce((sum, l) => sum + (Number(l.numberOfDays) || 0), 0);

  // Check matching profile in employees list for official leave balance
  const matchedEmployeeProfile = cleanTerm
    ? employees.find(
        (e) =>
          (e.name && e.name.toLowerCase().includes(cleanTerm)) ||
          (e.employeeId && e.employeeId.toLowerCase().includes(cleanTerm))
      )
    : null;
  // Reset pagination to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const startIndex = (currentPage - 1) * PAGE_LIMIT;
  const paginatedLeaves = filteredLeaves.slice(startIndex, startIndex + PAGE_LIMIT);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manage Leave Requests</h1>
        <p className="page-subtitle">Review, approve, or reject employee leave applications</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="table-container">
        {/* Toolbar: Search by Employee Name/ID & Filter by Status */}
        <div className="table-toolbar">
          <div className="search-bar-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Search employee by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", paddingRight: searchTerm ? "36px" : "16px" }}
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm("")}
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--dark-brown)" }}>
              Filter Status:
            </span>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Requests</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Dynamic Employee Leave History Summary Banner */}
        {cleanTerm && searchedEmployeeLeaves.length > 0 && (
          <div className="employee-history-card">
            <div className="history-card-header">
              <div className="history-card-title">
                <span style={{ fontSize: "1.3rem" }}>👤</span>
                <div>
                  Leave History for{" "}
                  <span style={{ color: "var(--medium-brown)", textDecoration: "underline" }}>
                    {matchedEmployeeProfile ? matchedEmployeeProfile.name : searchTerm}
                  </span>
                  {matchedEmployeeProfile && (
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginLeft: "8px", fontWeight: 500 }}>
                      ({matchedEmployeeProfile.employeeId} • {matchedEmployeeProfile.department})
                    </span>
                  )}
                </div>
              </div>

              <button
                className="btn-sm"
                onClick={() => setSearchTerm("")}
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--border)",
                  color: "var(--dark-brown)",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontWeight: 600
                }}
              >
                Clear Search ✕
              </button>
            </div>

            <div className="history-stats-grid">
              {/* Total Applied */}
              <div className="stat-pill">
                <span style={{ fontSize: "1.1rem" }}>📋</span>
                <div>
                  <div className="stat-pill-label">Total Applied</div>
                  <div className="stat-pill-value">
                    {searchedAppliedCount} requests ({searchedAppliedDays} days)
                  </div>
                </div>
              </div>

              {/* Leaves Taken Earlier (Approved) */}
              <div className="stat-pill stat-pill-approved">
                <span style={{ fontSize: "1.1rem" }}>✅</span>
                <div>
                  <div className="stat-pill-label">Leaves Taken (Approved)</div>
                  <div className="stat-pill-value">
                    {searchedApprovedLeaves.length} leaves ({searchedApprovedDays} days)
                  </div>
                </div>
              </div>

              {/* Pending Approval */}
              <div className="stat-pill stat-pill-pending">
                <span style={{ fontSize: "1.1rem" }}>⏳</span>
                <div>
                  <div className="stat-pill-label">Pending Approval</div>
                  <div className="stat-pill-value">
                    {searchedPendingLeaves.length} requests ({searchedPendingDays} days)
                  </div>
                </div>
              </div>

              {/* Rejected */}
              <div className="stat-pill stat-pill-rejected">
                <span style={{ fontSize: "1.1rem" }}>❌</span>
                <div>
                  <div className="stat-pill-label">Rejected</div>
                  <div className="stat-pill-value">
                    {searchedRejectedLeaves.length} requests ({searchedRejectedDays} days)
                  </div>
                </div>
              </div>

              {/* Official Balance if profile found */}
              {matchedEmployeeProfile && (
                <div className="stat-pill">
                  <span style={{ fontSize: "1.1rem" }}>⚖️</span>
                  <div>
                    <div className="stat-pill-label">Annual Leave Balance</div>
                    <div className="stat-pill-value">
                      {Math.max(0, (matchedEmployeeProfile.totalLeave || 24) - (matchedEmployeeProfile.usedLeave || 0))} days left (Used: {matchedEmployeeProfile.usedLeave || 0}/{matchedEmployeeProfile.totalLeave || 24})
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notice when search yields no matches */}
        {cleanTerm && searchedEmployeeLeaves.length === 0 && !loading && (
          <div style={{ padding: "16px 24px", background: "var(--bg-cream)", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            No leave records found matching <strong>"{searchTerm}"</strong>.
          </div>
        )}

        {loading ? (
          <p style={{ padding: "20px" }}>Loading leave requests...</p>
        ) : filteredLeaves.length === 0 ? (
          <p style={{ padding: "20px", color: "var(--text-muted)" }}>
            {cleanTerm
              ? `No requests match "${searchTerm}" under "${statusFilter}" status filter.`
              : "No leave applications match the selected filter."}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Leave Type</th>
                <th>From Date</th>
                <th>To Date</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeaves.map((item) => {
                const approvedDays = getEmployeeApprovedDays(item.employeeId, item.employeeName);
                const totalApplied = getEmployeeTotalAppliedCount(item.employeeId, item.employeeName);

                return (
                  <tr key={item._id}>
                    <td>
                      <div className="emp-name-cell">
                        <button
                          type="button"
                          className="emp-name-btn"
                          title={`Click to view all leave records for ${item.employeeName}`}
                          onClick={() => setSearchTerm(item.employeeName)}
                        >
                          {item.employeeName}
                          <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>🔍</span>
                        </button>
                        <span className="emp-taken-badge">
                          Taken earlier:{" "}
                          <strong>
                            {approvedDays} {approvedDays === 1 ? "day" : "days"}
                          </strong>
                          <span style={{ opacity: 0.7 }}>({totalApplied} applied)</span>
                        </span>
                      </div>
                    </td>
                    <td>{item.employeeId}</td>
                    <td>{item.leaveType}</td>
                    <td>{item.fromDate}</td>
                    <td>{item.toDate}</td>
                    <td>{item.numberOfDays}</td>
                    <td>{item.reason}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td>
                      {item.status === "Pending" ? (
                        <div className="action-group">
                          <button
                            className="btn-sm btn-approve"
                            onClick={() => openActionModal(item, "Approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="btn-sm btn-reject"
                            onClick={() => openActionModal(item, "Rejected")}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {item.adminResponse || "Completed"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination Navigator (10 items per page limit) */}
        {!loading && filteredLeaves.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredLeaves.length}
            itemsPerPage={PAGE_LIMIT}
            onPageChange={setCurrentPage}
            itemLabel="requests"
          />
        )}
      </div>

      {/* Action Modal */}
      {selectedLeave && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              {actionType === "Approved" ? "✅ Approve Leave Request" : "❌ Reject Leave Request"}
            </div>
            <p style={{ fontSize: "0.9rem", marginBottom: "12px" }}>
              Applicant: <strong>{selectedLeave.employeeName}</strong> ({selectedLeave.numberOfDays} Days)
            </p>
            <form onSubmit={handleUpdateStatus}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Admin Response (Optional)</label>
                <textarea
                  rows="3"
                  value={adminResponseText}
                  onChange={(e) => setAdminResponseText(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)"
                  }}
                />
              </div>

              <div className="form-actions" style={{ justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeActionModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn-sm ${actionType === "Approved" ? "btn-approve" : "btn-reject"}`}
                  style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                >
                  Confirm {actionType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequests;
