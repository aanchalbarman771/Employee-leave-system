import React, { useState, useEffect } from "react";

const ApplyLeave = ({ user, onSuccessRedirect }) => {
  const [leaveTypes, setLeaveTypes] = useState([
    "Casual Leave", "Sick Leave", "Earned Leave", "Other"
  ]);
  const [formData, setFormData] = useState({
    leaveType: "Casual Leave",
    fromDate: "",
    toDate: "",
    reason: ""
  });
  const [numberOfDays, setNumberOfDays] = useState(0);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      const res = await fetch("/api/leave-types");
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setLeaveTypes(data.map(lt => lt.name));
          setFormData(prev => ({ ...prev, leaveType: data[0].name }));
        }
      }
    } catch (err) {
      console.error("Using default leave types");
    }
  };

  // Automatically calculate number of days formula: To Date - From Date + 1
  useEffect(() => {
    if (formData.fromDate && formData.toDate) {
      const start = new Date(formData.fromDate);
      const end = new Date(formData.toDate);
      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setNumberOfDays(diffDays);
      } else {
        setNumberOfDays(0);
      }
    } else {
      setNumberOfDays(0);
    }
  }, [formData.fromDate, formData.toDate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!formData.fromDate || !formData.toDate || !formData.reason) {
      setMessage({ type: "danger", text: "Please fill all required fields." });
      return;
    }

    if (new Date(formData.toDate) < new Date(formData.fromDate)) {
      setMessage({ type: "danger", text: "To date cannot be before from date." });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        employeeId: user.employeeId,
        employeeName: user.name,
        leaveType: formData.leaveType,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        numberOfDays,
        reason: formData.reason
      };

      const response = await fetch("/api/leaves/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "danger", text: data.message || "Failed to submit leave request." });
      } else {
        setMessage({ type: "success", text: "Leave application submitted successfully." });
        setTimeout(() => {
          onSuccessRedirect();
        }, 1500);
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
        <h1 className="page-title">Apply for Leave</h1>
        <p className="page-subtitle">Submit a new leave application to admin for approval</p>
      </div>

      <div className="form-container">
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group form-full">
              <label>Leave Type *</label>
              <select name="leaveType" value={formData.leaveType} onChange={handleChange}>
                {leaveTypes.map((type, idx) => (
                  <option key={idx} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>From Date *</label>
              <input
                type="date"
                name="fromDate"
                value={formData.fromDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>To Date *</label>
              <input
                type="date"
                name="toDate"
                value={formData.toDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group form-full">
              <label>Calculated Number of Days:</label>
              <div>
                <span className="calculated-badge">
                  {numberOfDays} {numberOfDays === 1 ? "Day" : "Days"}
                </span>
              </div>
            </div>

            <div className="form-group form-full">
              <label>Reason for Leave *</label>
              <textarea
                name="reason"
                rows="4"
                placeholder="Explain reason for leave..."
                value={formData.reason}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit Leave Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeave;
