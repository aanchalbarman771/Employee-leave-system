import React, { useState, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";

const LeaveRequests = () => {
  const [leaves, setLeaves] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Modal State for optional Admin Response
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState(""); // "Approved" or "Rejected"
  const [adminResponseText, setAdminResponseText] = useState("");

  useEffect(() => {
    fetchLeaveRequests();
  }, [statusFilter]);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      let url = "http://localhost:5000/api/leaves";
      if (statusFilter !== "All") {
        url += `?status=${statusFilter}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (err) {
      console.error("Error fetching leave requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (leaveItem, action) => {
    setSelectedLeave(leaveItem);
    setActionType(action);
    setAdminResponseText(action === "Approved" ? "Your leave request has been approved." : "Sorry, your leave request is rejected.");
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
        fetchLeaveRequests();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "danger", text: data.message || "Failed to update leave request." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to server." });
    }
  };

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
        <div className="table-toolbar">
          <div style={{ fontWeight: 600 }}>Filter Status:</div>
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

        {loading ? (
          <p style={{ padding: "20px" }}>Loading leave requests...</p>
        ) : leaves.length === 0 ? (
          <p style={{ padding: "20px", color: "var(--text-muted)" }}>No leave applications match the selected filter.</p>
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
              {leaves.map((item) => (
                <tr key={item._id}>
                  <td><strong>{item.employeeName}</strong></td>
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
              ))}
            </tbody>
          </table>
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
