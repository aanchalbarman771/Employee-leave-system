const mongoose = require("mongoose");

// Schema for Leave Type
const leaveTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("LeaveType", leaveTypeSchema);
