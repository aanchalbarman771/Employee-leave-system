import React, { useState, useEffect } from "react";

const Profile = ({ user, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    department: user?.department || "IT",
    designation: user?.designation || ""
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/profile?employeeId=${user.employeeId}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name,
          phone: data.phone,
          department: data.department,
          designation: data.designation
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: user.employeeId,
          ...formData
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Profile updated successfully." });
        setIsEditing(false);
        if (data.user) {
          onUpdateUser({ ...user, ...data.user });
        }
      } else {
        setMessage({ type: "danger", text: data.message || "Failed to update profile." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Unable to connect to server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Employee Profile</h1>
        <p className="page-subtitle">View and manage your account details</p>
      </div>

      <div className="form-container">
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {!isEditing ? (
          <div>
            <div className="form-grid">
              <div className="form-group">
                <label>Employee ID</label>
                <input type="text" value={user.employeeId} disabled />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={formData.name} disabled />
              </div>
              <div className="form-group">
                <label>Email Address (Verified)</label>
                <input type="email" value={user.email} disabled />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" value={formData.phone} disabled />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input type="text" value={formData.department} disabled />
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input type="text" value={formData.designation} disabled />
              </div>
            </div>
            <div style={{ marginTop: "24px" }}>
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Employee ID (Read Only)</label>
                <input type="text" value={user.employeeId} disabled />
              </div>
              <div className="form-group">
                <label>Email Address (Read Only)</label>
                <input type="email" value={user.email} disabled />
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Department *</label>
                <select name="department" value={formData.department} onChange={handleChange}>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>

              <div className="form-group">
                <label>Designation *</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
