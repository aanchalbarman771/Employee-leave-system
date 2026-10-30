import React, { useState, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";
import Pagination from "../components/Pagination";

const MyLeaves = ({ user }) => {
  const [leaves, setLeaves] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_LIMIT = 10;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyLeaves();
  }, [user, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const fetchMyLeaves = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/leaves?employeeId=${user.employeeId}`;
      if (statusFilter !== "All") {
        url += `&status=${statusFilter}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (err) {
      console.error("Error fetching my leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  const startIndex = (currentPage - 1) * PAGE_LIMIT;
  const paginatedLeaves = leaves.slice(startIndex, startIndex + PAGE_LIMIT);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Leave History</h1>
        <p className="page-subtitle">View and filter all your past leave applications</p>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ fontWeight: 600, color: "var(--text)" }}>
            Filter by Status:
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <p style={{ padding: "20px" }}>Loading records...</p>
        ) : leaves.length === 0 ? (
          <p style={{ padding: "20px", color: "var(--text-muted)" }}>No leaves found for selected filter.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Admin Response</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeaves.map((item) => (
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

        {/* Pagination Navigator (10 leaves per page limit) */}
        {!loading && leaves.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={leaves.length}
            itemsPerPage={PAGE_LIMIT}
            onPageChange={setCurrentPage}
            itemLabel="leave records"
          />
        )}
      </div>
    </div>
  );
};

export default MyLeaves;
