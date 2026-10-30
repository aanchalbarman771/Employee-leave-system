import React, { useState, useEffect } from "react";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "password123",
    phone: "",
    department: "IT",
    designation: ""
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      name: "",
      email: "",
      password: "password123",
      phone: "",
      department: "IT",
      designation: ""
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      password: "",
      phone: emp.phone,
      department: emp.department,
      designation: emp.designation
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      const endpoint = editingEmployee
        ? "http://localhost:5000/api/employees/update"
        : "http://localhost:5000/api/employees/add";

      const payload = editingEmployee
        ? { id: editingEmployee._id, ...formData }
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
        fetchEmployees();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "danger", text: data.message || "Operation failed." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to server." });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete employee "${name}"?`)) return;

    try {
      const res = await fetch("http://localhost:5000/api/employees/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        fetchEmployees();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "danger", text: data.message || "Failed to delete employee." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to server." });
    }
  };

  // Simple Javascript Search Filtering by Employee Name or Employee ID
  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      emp.employeeId.toLowerCase().includes(term) ||
      emp.department.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Employee Management</h1>
        <p className="page-subtitle">View, add, edit, or search registered employees</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="table-container">
        <div className="table-toolbar">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search by Name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn-sm btn-edit" onClick={handleOpenAddModal}>
            + Add New Employee
          </button>
        </div>

        {loading ? (
          <p style={{ padding: "20px" }}>Loading employees...</p>
        ) : filteredEmployees.length === 0 ? (
          <p style={{ padding: "20px", color: "var(--text-muted)" }}>No employees found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp._id}>
                  <td><strong>{emp.employeeId}</strong></td>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.phone}</td>
                  <td>{emp.department}</td>
                  <td>{emp.designation}</td>
                  <td>
                    <div className="action-group">
                      <button
                        className="btn-sm btn-edit"
                        onClick={() => handleOpenEditModal(emp)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-sm btn-delete"
                        onClick={() => handleDelete(emp._id, emp.name)}
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
              {editingEmployee ? "✏️ Edit Employee" : "➕ Add New Employee"}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {!editingEmployee && (
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              {!editingEmployee && (
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label>Initial Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label>Phone Number *</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label>Department *</label>
                <select name="department" value={formData.department} onChange={handleChange}>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Designation *</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-actions" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-sm btn-edit" style={{ padding: "8px 16px" }}>
                  {editingEmployee ? "Update Employee" : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
