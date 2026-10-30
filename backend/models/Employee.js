const mongoose = require("mongoose");

// Schema for Employee
const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  totalLeave: { type: Number, default: 24 },
  usedLeave: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Employee", employeeSchema);
