import React, { useState, useEffect } from "react";

const LeaveTypes = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
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
    if (!window.confirm(`Are you sure you want to delete leave type "${name}"?`)) return;

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
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "danger", text: data.message || "Failed to delete leave type." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to server." });
    }
  };

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
              {leaveTypes.map((item) => (
                <tr key={item._id}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.description || "-"}</td>
                  <td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  placeholder="Short explanation of leave policy"
                />
              </div>

              <div className="form-actions" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-sm btn-edit" style={{ padding: "8px 16px" }}>
                  {editingType ? "Update Type" : "Add Type"}
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
