import React, { useState, useEffect } from "react";
import Pagination from "../components/Pagination";

const LeaveTypes = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_LIMIT = 10;
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/leave-types");
      if (res.ok) {
        const data = await res.json();
        setLeaveTypes(data);
      }
    } catch (err) {
      console.error("Error fetching leave types:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingType(null);
    setFormData({ name: "", description: "" });
    setShowModal(true);
  };

  const handleOpenEditModal = (typeItem) => {
    if (typeItem.name && typeItem.name.trim().toLowerCase() === "other") {
      setMessage({
        type: "warning",
        text: 'The "Other" leave type is a permanent system category and cannot be edited.'
      });
      return;
    }
    setEditingType(typeItem);
    setFormData({ name: typeItem.name, description: typeItem.description || "" });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingType(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (editingType && editingType.name && editingType.name.trim().toLowerCase() === "other") {
      setMessage({
        type: "danger",
        text: 'The "Other" leave type is protected and cannot be modified.'
      });
      return;
    }

    try {
      const endpoint = editingType
        ? "http://localhost:5000/api/leave-types/update"
        : "http://localhost:5000/api/leave-types/add";

      const payload = editingType
        ? { id: editingType._id, ...formData }
        : formData;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        handleCloseModal();
        fetchLeaveTypes();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "danger", text: data.message || "Operation failed." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to server." });
    }
  };

  const handleDelete = async (id, name) => {
    if (name && name.trim().toLowerCase() === "other") {
      setMessage({
        type: "warning",
        text: 'The "Other" leave type is a permanent system category and cannot be deleted.'
      });
      return;
    }

    const confirmMsg = `Are you sure you want to delete leave type "${name}"?\n\nIf any employee has applied for this leave, all their applications will automatically be moved to "Other".`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch("http://localhost:5000/api/leave-types/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        fetchLeaveTypes();
        setTimeout(() => setMessage({ type: "", text: "" }), 4000);
      } else {
        setMessage({ type: "danger", text: data.message || "Failed to delete leave type." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to server." });
    }
  };

  const startIndex = (currentPage - 1) * PAGE_LIMIT;
  const paginatedLeaveTypes = leaveTypes.slice(startIndex, startIndex + PAGE_LIMIT);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manage Leave Types</h1>
        <p className="page-subtitle">Configure allowed leave categories for employees</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}


      <div className="table-container">
        <div className="table-toolbar">
          <h2 className="section-title" style={{ margin: 0 }}>Available Leave Types</h2>
          <button className="btn-sm btn-edit" onClick={handleOpenAddModal}>
            + Add Leave Type
          </button>
        </div>

        {loading ? (
          <p style={{ padding: "20px" }}>Loading leave types...</p>
        ) : leaveTypes.length === 0 ? (
          <p style={{ padding: "20px", color: "var(--text-muted)" }}>No leave types found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Leave Type Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeaveTypes.map((item) => {
                const isOther = item.name && item.name.trim().toLowerCase() === "other";

                return (
                  <tr key={item._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong>{item.name}</strong>
                        {isOther && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: "var(--text-muted)",
                              background: "rgba(122, 92, 67, 0.08)",
                              padding: "2px 8px",
                              borderRadius: "12px"
                            }}
                          >
                            System Fallback
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{item.description || "-"}</td>
                    <td>
                      {isOther ? (
                        <span
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: "var(--dark-brown)",
                            background: "rgba(122, 92, 67, 0.1)",
                            border: "1px solid var(--border)",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px"
                          }}
                          title="System default category. Cannot be edited or deleted."
                        >
                          🔒 (No Delete / Edit)
                        </span>
                      ) : (
                        <div className="action-group">
                          <button
                            className="btn-sm btn-edit"
                            onClick={() => handleOpenEditModal(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-sm btn-delete"
                            onClick={() => handleDelete(item._id, item.name)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination Navigator (10 leave types limit) */}
        {!loading && leaveTypes.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={leaveTypes.length}
            itemsPerPage={PAGE_LIMIT}
            onPageChange={setCurrentPage}
            itemLabel="leave categories"
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              {editingType ? "✏️ Edit Leave Type" : "➕ Add Leave Type"}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label>Leave Type Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Maternity Leave"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of when this leave is applicable"
                />
              </div>

              <div className="form-actions" style={{ justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: "auto", padding: "10px 20px" }}
                >
                  {editingType ? "Update Leave Type" : "Save Leave Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveTypes;
