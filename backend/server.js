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

// Helper to generate 6-digit numeric OTP code
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Helper to safely generate unique Employee ID (e.g. EMP001, EMP002, ...) without duplicate collision
async function getNextEmployeeId() {
  const employees = await Employee.find({}, "employeeId");
  let maxId = 0;
  for (const emp of employees) {
    if (emp.employeeId && /^EMP\d+$/i.test(emp.employeeId)) {
      const num = parseInt(emp.employeeId.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    }
  }
  let candidateNum = maxId + 1;
  let candidateId = `EMP${String(candidateNum).padStart(3, "0")}`;
  while (await Employee.findOne({ employeeId: candidateId })) {
    candidateNum++;
    candidateId = `EMP${String(candidateNum).padStart(3, "0")}`;
  }
  return candidateId;
}

// Main HTTP Request Handler using built-in http module
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost:5000"}`);
  const path = parsedUrl.pathname;
  const method = req.method;
  const query = Object.fromEntries(parsedUrl.searchParams);

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
    // 1. REGISTER EMPLOYEE (With OTP Email Dispatch)
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

      const normalizedEmail = String(email).trim().toLowerCase();
      const assignedRole = "employee";

      // Check duplicate email
      const existingEmployee = await Employee.findOne({ email: normalizedEmail });
      if (existingEmployee) {
        return sendJSON(res, 400, { message: "Email is already registered. Please login with your password." });
      }

      // Generate unique employee ID safely without duplicate key collision
      const employeeId = await getNextEmployeeId();

      // Save new Employee record (directly active - no OTP required)
      const newEmployee = new Employee({
        employeeId,
        name,
        email: normalizedEmail,
        password,
        phone,
        department,
        designation,
        emailVerified: true,
        totalLeave: 24,
        usedLeave: 0,
        role: assignedRole
      });
      await newEmployee.save();

      return sendJSON(res, 201, {
        message: "Registration successful! You can now login with your email and password.",
        email: normalizedEmail,
        requiresOTP: false
      });
    }

    // ----------------------------------------------------
    // 2. VERIFY OTP (Registration & Login Verification)
    // ----------------------------------------------------
    if (path === "/api/verify-otp" && method === "POST") {
      const { email, otp, purpose } = await getRequestBody(req);

      if (!email || !otp) {
        return sendJSON(res, 400, { message: "Email and 6-digit OTP code are required." });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const cleanOtp = String(otp).trim();

      const otpRecord = await OTP.findOne({ email: normalizedEmail });
      if (!otpRecord) {
        return sendJSON(res, 400, { message: "No active OTP found for this email. Please click Resend OTP." });
      }

      if (new Date() > new Date(otpRecord.otpExpiry)) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return sendJSON(res, 400, { message: "OTP code has expired. Please click 'Resend OTP' to get a fresh code." });
      }

      if (otpRecord.otp !== cleanOtp) {
        return sendJSON(res, 400, { message: "Incorrect OTP code. Please check your email and try again." });
      }

      // OTP Verified successfully!
      await OTP.deleteOne({ _id: otpRecord._id });
      await Employee.updateOne({ email: normalizedEmail }, { emailVerified: true });

      // If purpose is for password reset verification only
      if (purpose === "forgot-password") {
        return sendJSON(res, 200, {
          message: "OTP code verified successfully! You may now set your new password.",
          verified: true
        });
      }

      // Look up authenticated user profile
      let employee = await Employee.findOne({ email: normalizedEmail });
      let userObj = null;

      if (normalizedEmail === "admin@gmail.com") {
        userObj = {
          role: "admin",
          employeeId: employee ? employee.employeeId : "EMP000",
          name: employee ? employee.name : "System Administrator",
          email: "admin@gmail.com",
          phone: employee ? employee.phone : "9876543210",
          department: "IT",
          designation: "Administrator"
        };
      } else if (employee) {
        userObj = {
          role: employee.role || "employee",
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          department: employee.department,
          designation: employee.designation,
          totalLeave: employee.totalLeave,
          usedLeave: employee.usedLeave
        };
      } else {
        return sendJSON(res, 404, { message: "Email does not exist. This account is not registered. Please register." });
      }

      return sendJSON(res, 200, {
        message: "OTP verified successfully! Access granted.",
        verified: true,
        user: userObj
      });
    }

    // ----------------------------------------------------
    // 3. RESEND OTP CODE
    // ----------------------------------------------------
    if (path === "/api/resend-otp" && method === "POST") {
      const { email } = await getRequestBody(req);

      if (!email) {
        return sendJSON(res, 400, { message: "Email address is required." });
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      // Verify that the email is registered
      const employee = await Employee.findOne({ email: normalizedEmail });
      const isAdminEmail = (normalizedEmail === "admin@gmail.com");

      if (!employee && !isAdminEmail) {
        return sendJSON(res, 404, {
          message: "Email does not exist. This email is not registered in our system. Please check your email or register."
        });
      }

      // Generate new 6-digit OTP code & save with 10-minute expiry
      const generatedOtp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await OTP.deleteMany({ email: normalizedEmail });
      await new OTP({ email: normalizedEmail, otp: generatedOtp, otpExpiry }).save();

      // Dispatch Email via Nodemailer
      const mailResult = await sendOTPEmail(normalizedEmail, generatedOtp);

      if (!mailResult.sentToMail) {
        return sendJSON(res, 500, {
          message: `Unable to send OTP email to ${normalizedEmail}. Please verify your internet connection or email configuration.`
        });
      }

      return sendJSON(res, 200, {
        message: `A fresh 6-digit OTP code has been dispatched to ${normalizedEmail}. Please check your inbox.`,
        email: normalizedEmail,
        sentToMail: true
      });
    }

    // ----------------------------------------------------
    // 4. SEND LOGIN OTP (Direct Email OTP Authentication)
    // ----------------------------------------------------
    if (path === "/api/send-login-otp" && method === "POST") {
      const { email } = await getRequestBody(req);

      if (!email) {
        return sendJSON(res, 400, { message: "Please enter your email address." });
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return sendJSON(res, 400, { message: "Please enter a valid email address (e.g. name@gmail.com)." });
      }

      // Verify that the email exists in the database
      const employee = await Employee.findOne({ email: normalizedEmail });
      const isAdminEmail = (normalizedEmail === "admin@gmail.com");

      if (!employee && !isAdminEmail) {
        return sendJSON(res, 404, {
          message: "Email does not exist. This email is not registered in our system. Please check your email or register."
        });
      }

      const generatedOtp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await OTP.deleteMany({ email: normalizedEmail });
      await new OTP({ email: normalizedEmail, otp: generatedOtp, otpExpiry }).save();

      // Send OTP via Nodemailer
      const mailResult = await sendOTPEmail(normalizedEmail, generatedOtp);

      if (!mailResult.sentToMail) {
        return sendJSON(res, 500, {
          message: `Unable to send OTP email to ${normalizedEmail}. Please verify your internet connection or email configuration.`
        });
      }

      return sendJSON(res, 200, {
        message: `A 6-digit OTP code has been sent to your email inbox (${normalizedEmail}).`,
        email: normalizedEmail,
        sentToMail: true
      });
    }

    // ----------------------------------------------------
    // 5. LOGIN (Password & Email OTP Verification)
    // ----------------------------------------------------
    if (path === "/api/login" && method === "POST") {
      const { email, password, otp } = await getRequestBody(req);

      if (!email) {
        return sendJSON(res, 400, { message: "Please enter your email address." });
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return sendJSON(res, 400, { message: "Please enter a valid email address (e.g. name@gmail.com)." });
      }

      // Check if user exists in database
      const employee = await Employee.findOne({ email: normalizedEmail });
      const isAdminEmail = (normalizedEmail === "admin@gmail.com");

      if (!employee && !isAdminEmail) {
        return sendJSON(res, 404, {
          message: "Email does not exist. This email is not registered in our system. Please check your email or register.",
          field: "email",
          emailExists: false
        });
      }

      // Case A: Verify with OTP Code
      if (otp) {
        const cleanOtp = String(otp).trim();
        const otpRecord = await OTP.findOne({ email: normalizedEmail });
        if (!otpRecord) {
          return sendJSON(res, 400, { message: "Invalid or expired OTP. Please request a new code." });
        }
        if (new Date() > new Date(otpRecord.otpExpiry)) {
          await OTP.deleteOne({ _id: otpRecord._id });
          return sendJSON(res, 400, { message: "OTP has expired. Please request a new code." });
        }
        if (otpRecord.otp !== cleanOtp) {
          return sendJSON(res, 400, { message: "Incorrect OTP code. Please enter the valid code." });
        }

        await OTP.deleteOne({ _id: otpRecord._id });
        if (employee) {
          employee.emailVerified = true;
          await employee.save();
        }

        const userObj = employee ? {
          role: employee.role || "employee",
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          department: employee.department,
          designation: employee.designation,
          totalLeave: employee.totalLeave,
          usedLeave: employee.usedLeave
        } : (isAdminEmail ? {
          role: "admin",
          name: "Administrator",
          email: "admin@gmail.com"
        } : null);

        return sendJSON(res, 200, {
          message: "OTP verified! Login successful.",
          requiresOTP: false,
          user: userObj
        });
      }

      // Case B: Password Login Check
      if (!password) {
        return sendJSON(res, 400, { message: "Please enter your password." });
      }

      // Check Password
      let isPasswordCorrect = false;
      if (isAdminEmail) {
        isPasswordCorrect = (password === "admin123" || (employee && employee.password === password));
      } else {
        isPasswordCorrect = (employee.password === password);
      }

      if (!isPasswordCorrect) {
        return sendJSON(res, 400, {
          message: "Incorrect password. Please try again.",
          field: "password"
        });
      }

      // Email and Password are correct! Generate and dispatch 6-digit OTP to user's email
      const generatedOtp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await OTP.deleteMany({ email: normalizedEmail });
      await new OTP({ email: normalizedEmail, otp: generatedOtp, otpExpiry }).save();

      // Dispatch Email via Nodemailer
      const mailResult = await sendOTPEmail(normalizedEmail, generatedOtp);

      if (!mailResult.sentToMail) {
        return sendJSON(res, 500, {
          message: `Unable to send verification OTP to ${normalizedEmail}. Please check your internet connection or email configuration.`
        });
      }

      return sendJSON(res, 200, {
        message: `A 6-digit verification OTP has been sent to your email (${normalizedEmail}). Please check your inbox to complete login.`,
        requiresOTP: true,
        email: normalizedEmail,
        sentToMail: true
      });
    }

    // ----------------------------------------------------
    // 6. FORGOT PASSWORD (3-Step OTP-Based Password Reset)
    // ----------------------------------------------------
    if (path === "/api/forgot-password" && method === "POST") {
      const { email, otp, resetToken, newPassword, confirmPassword, verifyOnly } = await getRequestBody(req);

      if (!email) {
        return sendJSON(res, 400, { message: "Email address is required." });
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      // Step 1: Send Password Reset OTP
      if (!otp && !resetToken && !newPassword) {
        const employee = await Employee.findOne({ email: normalizedEmail });
        if (!employee && normalizedEmail !== "admin@gmail.com") {
          return sendJSON(res, 404, { message: "No account found with this email address." });
        }

        const generatedOtp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await OTP.deleteMany({ email: normalizedEmail });
        await new OTP({ email: normalizedEmail, otp: generatedOtp, otpExpiry, verified: false }).save();

        const mailResult = await sendOTPEmail(normalizedEmail, generatedOtp);

        if (!mailResult.sentToMail) {
          return sendJSON(res, 500, {
            message: `Unable to send password reset OTP to ${normalizedEmail}. Please check your internet connection or email configuration.`
          });
        }

        return sendJSON(res, 200, {
          message: `Password reset OTP has been sent to your email inbox (${normalizedEmail}).`,
          requiresOTP: true,
          email: normalizedEmail,
          sentToMail: true
        });
      }

      // Step 2: Verify OTP code only (Transitions to New Password screen)
      if (otp && !newPassword) {
        const cleanOtp = String(otp).trim();
        const otpRecord = await OTP.findOne({ email: normalizedEmail });

        if (!otpRecord) {
          return sendJSON(res, 400, { message: "No active OTP found. Please request a new code." });
        }

        if (new Date() > new Date(otpRecord.otpExpiry)) {
          await OTP.deleteOne({ _id: otpRecord._id });
          return sendJSON(res, 400, { message: "OTP code has expired. Please request a new code." });
        }

        if (otpRecord.otp !== cleanOtp) {
          return sendJSON(res, 400, { message: "Incorrect 6-digit OTP code. Please check your email." });
        }

        // Generate a random secure reset token for Step 3
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        otpRecord.verified = true;
        otpRecord.resetToken = token;
        await otpRecord.save();

        return sendJSON(res, 200, {
          message: "OTP code verified successfully! You may now set your new password.",
          verified: true,
          resetToken: token
        });
      }

      // Step 3: Update Password with verified token or valid OTP
      if (newPassword) {
        if (confirmPassword && newPassword !== confirmPassword) {
          return sendJSON(res, 400, { message: "New Password and Confirm Password must match." });
        }

        if (newPassword.length < 4) {
          return sendJSON(res, 400, { message: "Password must be at least 4 characters long." });
        }

        // Verify either via resetToken or via cleanOtp
        let authorized = false;
        if (resetToken) {
          const tokenRecord = await OTP.findOne({ email: normalizedEmail, resetToken, verified: true });
          if (tokenRecord) {
            authorized = true;
          }
        }

        if (!authorized && otp) {
          const cleanOtp = String(otp).trim();
          const otpRecord = await OTP.findOne({ email: normalizedEmail });
          if (otpRecord && otpRecord.otp === cleanOtp && new Date() <= new Date(otpRecord.otpExpiry)) {
            authorized = true;
          }
        }

        if (!authorized) {
          return sendJSON(res, 400, { message: "Password reset authorization failed or expired. Please start over." });
        }

        // Update password in DB
        await OTP.deleteMany({ email: normalizedEmail });
        await Employee.updateOne(
          { email: normalizedEmail },
          { password: newPassword, emailVerified: true }
        );

        return sendJSON(res, 200, {
          message: "Password updated successfully! You can now log in with your new password."
        });
      }

      return sendJSON(res, 400, { message: "Invalid password reset request." });
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

      // Only return leaves for employees who currently exist in the database
      const existingEmployees = await Employee.find({}, "employeeId");
      const validEmpIds = existingEmployees.map(e => e.employeeId);

      let filter = {
        employeeId: { $in: validEmpIds }
      };
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

      const employeeId = await getNextEmployeeId();

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

      const empToDelete = await Employee.findById(id);
      if (empToDelete) {
        if (empToDelete.email === "aanchalbarman91@gmail.com" || empToDelete.role === "admin") {
          return sendJSON(res, 400, { message: "Primary Administrator account cannot be deleted." });
        }
        // Cascade delete all leave requests of this employee so no orphaned records remain
        await LeaveRequest.deleteMany({ employeeId: empToDelete.employeeId });
        await Employee.findByIdAndDelete(id);
      }
      return sendJSON(res, 200, { message: "Employee and associated leave records deleted successfully." });
    }

    // ----------------------------------------------------
    // 9. LEAVE TYPES MANAGEMENT (ADMIN CRUD)
    // ----------------------------------------------------
    if (path === "/api/leave-types" && method === "GET") {
      // Ensure "Other" leave type always exists in the database
      const otherExists = await LeaveType.findOne({ name: { $regex: /^other$/i } });
      if (!otherExists) {
        await new LeaveType({
          name: "Other",
          description: "Default category for special, other, or reclassified leaves"
        }).save();
      }

      const leaveTypes = await LeaveType.find().sort({ createdAt: 1 });
      return sendJSON(res, 200, leaveTypes);
    }

    if (path === "/api/leave-types/add" && method === "POST") {
      const { name, description } = await getRequestBody(req);

      if (!name) {
        return sendJSON(res, 400, { message: "Leave type name is required." });
      }

      const cleanName = name.trim();

      const existing = await LeaveType.findOne({
        name: { $regex: new RegExp(`^${cleanName}$`, "i") }
      });
      if (existing) {
        return sendJSON(res, 400, { message: `Leave type "${cleanName}" already exists.` });
      }

      await new LeaveType({ name: cleanName, description: description || "" }).save();
      return sendJSON(res, 201, { message: "Leave type added successfully." });
    }

    if (path === "/api/leave-types/update" && method === "POST") {
      const { id, name, description } = await getRequestBody(req);

      if (!id || !name) {
        return sendJSON(res, 400, { message: "ID and Name are required." });
      }

      const targetType = await LeaveType.findById(id);
      if (!targetType) {
        return sendJSON(res, 404, { message: "Leave type not found." });
      }

      // "Other" category is a protected system default - cannot be edited or renamed
      if (targetType.name.trim().toLowerCase() === "other") {
        return sendJSON(res, 400, {
          message: 'The "Other" leave type is a permanent system category and cannot be edited or renamed.'
        });
      }

      const cleanName = name.trim();
      const oldName = targetType.name;

      targetType.name = cleanName;
      targetType.description = description || "";
      await targetType.save();

      // If renamed, update all existing employee leave applications that used the old name
      if (oldName !== cleanName) {
        await LeaveRequest.updateMany(
          { leaveType: { $regex: new RegExp(`^${oldName}$`, "i") } },
          { $set: { leaveType: cleanName } }
        );
      }

      return sendJSON(res, 200, { message: "Leave type updated successfully." });
    }

    if (path === "/api/leave-types/delete" && method === "POST") {
      const { id } = await getRequestBody(req);

      if (!id) {
        return sendJSON(res, 400, { message: "ID is required." });
      }

      const leaveType = await LeaveType.findById(id);
      if (!leaveType) {
        return sendJSON(res, 404, { message: "Leave type not found." });
      }

      // "Other" category cannot be deleted
      if (leaveType.name.trim().toLowerCase() === "other") {
        return sendJSON(res, 400, {
          message: 'The "Other" leave type is a permanent system category and cannot be deleted.'
        });
      }

      // Ensure "Other" leave type exists as the destination category
      let otherType = await LeaveType.findOne({ name: { $regex: /^other$/i } });
      if (!otherType) {
        otherType = await new LeaveType({
          name: "Other",
          description: "Default category for special, other, or reclassified leaves"
        }).save();
      }

      // Delete the requested leave type
      await LeaveType.findByIdAndDelete(id);

      // Reassign all existing employee leave applications that used this deleted leave type to "Other"
      const updateResult = await LeaveRequest.updateMany(
        { leaveType: { $regex: new RegExp(`^${leaveType.name.trim()}$`, "i") } },
        { $set: { leaveType: "Other" } }
      );

      const count = updateResult.modifiedCount || 0;
      const successMsg = count > 0
        ? `Leave type "${leaveType.name}" deleted. ${count} employee leave application(s) previously under "${leaveType.name}" have been automatically moved to "Other".`
        : `Leave type "${leaveType.name}" deleted successfully.`;

      return sendJSON(res, 200, {
        message: successMsg,
        reassignedCount: count
      });
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
