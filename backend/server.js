const http = require("http");
const url = require("url");
require("dotenv").config();

const connectDB = require("./database");
const sendOTPEmail = require("./email").sendOTPEmail;

// Mongoose Models
const Employee = require("./models/Employee");
const LeaveRequest = require("./models/LeaveRequest");
const LeaveType = require("./models/LeaveType");
const OTP = require("./models/OTP");

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

// Helper to parse JSON request body from HTTP stream
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", err => reject(err));
  });
}

// Helper to send JSON responses with CORS headers
function sendJSON(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(payload));
}

// Main HTTP Request Handler using built-in http module
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  const query = parsedUrl.query;

  // Handle CORS Preflight OPTIONS Request
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    return res.end();
  }

  try {
    // ----------------------------------------------------
    // 1. REGISTER EMPLOYEE
    // ----------------------------------------------------
    if (path === "/api/register" && method === "POST") {
      const { name, email, password, confirmPassword, phone, department, designation } = await getRequestBody(req);

      // Validation
      if (!name || !email || !password || !phone || !department || !designation) {
        return sendJSON(res, 400, { message: "Please fill all required fields." });
      }
      if (password !== confirmPassword) {
        return sendJSON(res, 400, { message: "Password and Confirm Password must match." });
      }

      // Check duplicate email
      const existingEmployee = await Employee.findOne({ email });
      if (existingEmployee) {
        return sendJSON(res, 400, { message: "Email already registered." });
      }

      // Generate unique employee ID (EMP001, EMP002, etc.)
      const totalEmp = await Employee.countDocuments();
      const employeeId = `EMP${String(totalEmp + 1).padStart(3, "0")}`;

      // Save Employee record (unverified initially)
      const newEmployee = new Employee({
        employeeId,
        name,
        email,
        password,
        phone,
        department,
        designation,
        emailVerified: false,
        totalLeave: 24,
        usedLeave: 0
      });
      await newEmployee.save();

      // Generate 6-digit OTP
      const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // Expiration: 5 minutes

      // Save OTP record
      await OTP.deleteMany({ email }); // Clear old OTPs for email
      await new OTP({ email, otp: generatedOtp, otpExpiry }).save();

      // Send OTP via Nodemailer
      await sendOTPEmail(email, generatedOtp);

      return sendJSON(res, 201, {
        message: "OTP has been sent to your email.",
        email
      });
    }

    // ----------------------------------------------------
    // 2. VERIFY OTP
    // ----------------------------------------------------
    if (path === "/api/verify-otp" && method === "POST") {
      const { email, otp } = await getRequestBody(req);

      if (!email || !otp) {
        return sendJSON(res, 400, { message: "Email and OTP are required." });
      }

      const otpRecord = await OTP.findOne({ email });
      if (!otpRecord) {
        return sendJSON(res, 400, { message: "Invalid OTP. Please try again." });
      }

      if (new Date() > new Date(otpRecord.otpExpiry)) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return sendJSON(res, 400, { message: "OTP has expired. Please request a new OTP." });
      }

      if (otpRecord.otp !== String(otp).trim()) {
        return sendJSON(res, 400, { message: "Invalid OTP. Please try again." });
      }

      // Mark Employee email as verified
      await Employee.updateOne({ email }, { emailVerified: true });
      await OTP.deleteOne({ _id: otpRecord._id });

      return sendJSON(res, 200, { message: "Email verified successfully." });
    }

    // ----------------------------------------------------
    // 3. RESEND OTP
    // ----------------------------------------------------
    if (path === "/api/resend-otp" && method === "POST") {
      const { email } = await getRequestBody(req);

      if (!email) {
        return sendJSON(res, 400, { message: "Email is required." });
      }

      const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      await OTP.deleteMany({ email });
      await new OTP({ email, otp: generatedOtp, otpExpiry }).save();

      await sendOTPEmail(email, generatedOtp);

      return sendJSON(res, 200, { message: "OTP has been resent to your email." });
    }

    // ----------------------------------------------------
    // 4. LOGIN (Employee or Admin)
    // ----------------------------------------------------
    if (path === "/api/login" && method === "POST") {
      const { email, password } = await getRequestBody(req);

      if (!email || !password) {
        return sendJSON(res, 400, { message: "Please enter email and password." });
      }

      // Admin Login Check
      if (email === "admin@gmail.com" && password === "admin123") {
        return sendJSON(res, 200, {
          message: "Admin login successful.",
          user: {
            role: "admin",
            name: "Administrator",
            email: "admin@gmail.com"
          }
        });
      }

      // Employee Login Check
      const employee = await Employee.findOne({ email, password });
      if (!employee) {
        return sendJSON(res, 400, { message: "Invalid email or password." });
      }

      if (!employee.emailVerified) {
        // Send new OTP if email is not verified
        const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        await OTP.deleteMany({ email });
        await new OTP({ email, otp: generatedOtp, otpExpiry }).save();
        await sendOTPEmail(email, generatedOtp);

        return sendJSON(res, 403, {
          message: "Email is not verified. OTP sent to email.",
          requiresOTP: true,
          email
        });
      }

      return sendJSON(res, 200, {
        message: "Login successful.",
        user: {
          role: "employee",
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          department: employee.department,
          designation: employee.designation,
          totalLeave: employee.totalLeave,
          usedLeave: employee.usedLeave
        }
      });
    }

    // ----------------------------------------------------
    // 5. FORGOT PASSWORD (OTP based)
    // ----------------------------------------------------
    if (path === "/api/forgot-password" && method === "POST") {
      const { email, otp, newPassword } = await getRequestBody(req);

      // Step A: Send OTP
      if (!otp && !newPassword) {
        const employee = await Employee.findOne({ email });
        if (!employee) {
          return sendJSON(res, 404, { message: "Email not registered." });
        }
        const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        await OTP.deleteMany({ email });
        await new OTP({ email, otp: generatedOtp, otpExpiry }).save();
        await sendOTPEmail(email, generatedOtp);
        return sendJSON(res, 200, { message: "Password reset OTP sent to your email." });
      }

      // Step B: Reset Password with OTP
      const otpRecord = await OTP.findOne({ email });
      if (!otpRecord || otpRecord.otp !== String(otp).trim()) {
        return sendJSON(res, 400, { message: "Invalid OTP. Please try again." });
      }
      if (new Date() > new Date(otpRecord.otpExpiry)) {
        return sendJSON(res, 400, { message: "OTP has expired. Please request a new OTP." });
      }

      await Employee.updateOne({ email }, { password: newPassword });
      await OTP.deleteOne({ _id: otpRecord._id });

      return sendJSON(res, 200, { message: "Password updated successfully. You can now login." });
    }

    // ----------------------------------------------------
    // 6. EMPLOYEE PROFILE & UPDATE
    // ----------------------------------------------------
    if (path === "/api/profile" && method === "GET") {
      const { employeeId } = query;
      const employee = await Employee.findOne({ employeeId });
      if (!employee) {
        return sendJSON(res, 404, { message: "Employee not found." });
      }
      return sendJSON(res, 200, employee);
    }

    if (path === "/api/profile/update" && method === "POST") {
      const { employeeId, name, phone, department, designation } = await getRequestBody(req);
      if (!employeeId) {
        return sendJSON(res, 400, { message: "Employee ID is required." });
      }

      const updated = await Employee.findOneAndUpdate(
        { employeeId },
        { name, phone, department, designation },
        { new: true }
      );
      return sendJSON(res, 200, { message: "Profile updated successfully.", user: updated });
    }

    // ----------------------------------------------------
    // 7. LEAVE APPLICATIONS (APPLY, GET, UPDATE STATUS)
    // ----------------------------------------------------
    if (path === "/api/leaves/apply" && method === "POST") {
      const { employeeId, employeeName, leaveType, fromDate, toDate, numberOfDays, reason } = await getRequestBody(req);

      if (!employeeId || !leaveType || !fromDate || !toDate || !reason) {
        return sendJSON(res, 400, { message: "Please fill all required fields." });
      }

      if (new Date(toDate) < new Date(fromDate)) {
        return sendJSON(res, 400, { message: "To date cannot be before from date." });
      }

      const newLeave = new LeaveRequest({
        employeeId,
        employeeName,
        leaveType,
        fromDate,
        toDate,
        numberOfDays: Number(numberOfDays),
        reason,
        status: "Pending",
        adminResponse: ""
      });

      await newLeave.save();
      return sendJSON(res, 201, { message: "Leave application submitted successfully." });
    }

    if (path === "/api/leaves" && method === "GET") {
      const { employeeId, status } = query;
      let filter = {};
      if (employeeId) filter.employeeId = employeeId;
      if (status && status !== "All") filter.status = status;

      const leaves = await LeaveRequest.find(filter).sort({ createdAt: -1 });
      return sendJSON(res, 200, leaves);
    }

    if (path === "/api/leaves/update" && method === "POST") {
      const { id, status, adminResponse } = await getRequestBody(req);

      if (!id || !status) {
        return sendJSON(res, 400, { message: "Leave ID and Status are required." });
      }

      const leave = await LeaveRequest.findById(id);
      if (!leave) {
        return sendJSON(res, 404, { message: "Leave request not found." });
      }

      const prevStatus = leave.status;
      leave.status = status;
      if (adminResponse !== undefined) {
        leave.adminResponse = adminResponse;
      }
      await leave.save();

      // Adjust leave balance of employee
      if (status === "Approved" && prevStatus !== "Approved") {
        await Employee.updateOne(
          { employeeId: leave.employeeId },
          { $inc: { usedLeave: leave.numberOfDays } }
        );
      } else if (prevStatus === "Approved" && status !== "Approved") {
        // Revert leave balance if previously approved and now changed
        await Employee.updateOne(
          { employeeId: leave.employeeId },
          { $inc: { usedLeave: -leave.numberOfDays } }
        );
      }

      const successMsg = status === "Approved" ? "Leave approved successfully." : "Leave rejected successfully.";
      return sendJSON(res, 200, { message: successMsg });
    }

    // ----------------------------------------------------
    // 8. EMPLOYEE MANAGEMENT (ADMIN CRUD)
    // ----------------------------------------------------
    if (path === "/api/employees" && method === "GET") {
      const employees = await Employee.find().sort({ createdAt: -1 });
      return sendJSON(res, 200, employees);
    }

    if (path === "/api/employees/add" && method === "POST") {
      const { name, email, password, phone, department, designation, role } = await getRequestBody(req);

      if (!name || !email || !password || !phone || !department || !designation) {
        return sendJSON(res, 400, { message: "Please fill all required fields." });
      }

      const existing = await Employee.findOne({ email });
      if (existing) {
        return sendJSON(res, 400, { message: "Email already registered." });
      }

      const totalEmp = await Employee.countDocuments();
      const employeeId = `EMP${String(totalEmp + 1).padStart(3, "0")}`;

      const newEmp = new Employee({
        employeeId,
        name,
        email,
        password,
        phone,
        department,
        designation,
        emailVerified: true, // Direct admin addition auto-verifies
        totalLeave: 24,
        usedLeave: 0,
        role: role || "employee"
      });

      await newEmp.save();
      return sendJSON(res, 201, { message: "Employee added successfully." });
    }

    if (path === "/api/employees/update" && method === "POST") {
      const { id, name, phone, department, designation, role } = await getRequestBody(req);

      if (!id) {
        return sendJSON(res, 400, { message: "Employee record ID required." });
      }

      const updateData = { name, phone, department, designation };
      if (role) updateData.role = role;

      await Employee.findByIdAndUpdate(id, updateData);
      return sendJSON(res, 200, { message: "Employee details updated successfully." });
    }

    if (path === "/api/employees/delete" && method === "POST") {
      const { id } = await getRequestBody(req);

      if (!id) {
        return sendJSON(res, 400, { message: "Employee record ID required." });
      }

      await Employee.findByIdAndDelete(id);
      return sendJSON(res, 200, { message: "Employee deleted successfully." });
    }

    // ----------------------------------------------------
    // 9. LEAVE TYPES MANAGEMENT (ADMIN CRUD)
    // ----------------------------------------------------
    if (path === "/api/leave-types" && method === "GET") {
      const leaveTypes = await LeaveType.find().sort({ createdAt: 1 });
      return sendJSON(res, 200, leaveTypes);
    }

    if (path === "/api/leave-types/add" && method === "POST") {
      const { name, description } = await getRequestBody(req);

      if (!name) {
        return sendJSON(res, 400, { message: "Leave type name is required." });
      }

      const existing = await LeaveType.findOne({ name });
      if (existing) {
        return sendJSON(res, 400, { message: "Leave type already exists." });
      }

      await new LeaveType({ name, description }).save();
      return sendJSON(res, 201, { message: "Leave type added successfully." });
    }

    if (path === "/api/leave-types/update" && method === "POST") {
      const { id, name, description } = await getRequestBody(req);

      if (!id || !name) {
        return sendJSON(res, 400, { message: "ID and Name are required." });
      }

      await LeaveType.findByIdAndUpdate(id, { name, description });
      return sendJSON(res, 200, { message: "Leave type updated successfully." });
    }

    if (path === "/api/leave-types/delete" && method === "POST") {
      const { id } = await getRequestBody(req);

      if (!id) {
        return sendJSON(res, 400, { message: "ID is required." });
      }

      await LeaveType.findByIdAndDelete(id);
      return sendJSON(res, 200, { message: "Leave type deleted successfully." });
    }

    // Fallback for Unknown API Endpoints
    return sendJSON(res, 404, { message: "API endpoint not found." });

  } catch (error) {
    console.error("Server Error:", error);
    return sendJSON(res, 500, { message: "Internal server error: " + error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Backend HTTP Server running on http://localhost:${PORT}`);
  console.log(`(Powered by Node.js http module - Express is NOT used)`);
});
