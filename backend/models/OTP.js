const mongoose = require("mongoose");

// Schema for temporary OTP storage
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  otpExpiry: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  resetToken: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("OTP", otpSchema);
