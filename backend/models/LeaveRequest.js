const mongoose = require("mongoose");

// Schema for Leave Request
const leaveRequestSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  leaveType: { type: String, required: true },
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  numberOfDays: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  adminResponse: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
