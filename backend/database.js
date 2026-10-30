const mongoose = require("mongoose");
const Employee = require("./models/Employee");
const LeaveRequest = require("./models/LeaveRequest");
const LeaveType = require("./models/LeaveType");

async function connectDB() {
  const mongoURI = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/employee_leave_db";

  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB successfully.");

    // Seed sample data if database is empty
    await seedSampleData();
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }
}

async function seedSampleData() {
  try {
    // Seed default Leave Types if none exist
    const leaveTypeCount = await LeaveType.countDocuments();
    if (leaveTypeCount === 0) {
      await LeaveType.insertMany([
        { name: "Casual Leave", description: "Short-term casual leave for personal work" },
        { name: "Sick Leave", description: "Medical leave due to health issues" },
        { name: "Earned Leave", description: "Privilege or earned annual leave" },
        { name: "Other", description: "Special or emergency leave" }
      ]);
      console.log("Seeded default Leave Types.");
    }

    // Remove obsolete "admin@gmail.com" System Administrator if present
    await Employee.deleteOne({ email: "admin@gmail.com" });

    // Ensure Aanchal (aanchalbarman91@gmail.com) is the single Admin with ID EMP000
    const aanchalAdmin = await Employee.findOne({ email: "aanchalbarman91@gmail.com" });
    if (!aanchalAdmin) {
      await Employee.create({
        employeeId: "EMP000",
        name: "Aanchal",
        email: "aanchalbarman91@gmail.com",
        password: "password123",
        phone: "9876543210",
        department: "Administration",
        designation: "System Administrator",
        emailVerified: true,
        totalLeave: 30,
        usedLeave: 0,
        role: "admin"
      });
      console.log("Seeded Admin user Aanchal (aanchalbarman91@gmail.com / EMP000).");
    } else if (aanchalAdmin.employeeId !== "EMP000" || aanchalAdmin.role !== "admin") {
      aanchalAdmin.employeeId = "EMP000";
      aanchalAdmin.role = "admin";
      await aanchalAdmin.save();
      console.log("Updated Aanchal to Admin with employeeId EMP000.");
    }

    // Seed default sample employees if none exist
    const rahulExists = await Employee.findOne({ email: "rahul@gmail.com" });
    if (!rahulExists) {
      await Employee.create({
        employeeId: "EMP001",
        name: "Rahul Sharma",
        email: "rahul@gmail.com",
        password: "password123",
        phone: "9876543211",
        department: "IT",
        designation: "Software Engineer",
        emailVerified: true,
        totalLeave: 24,
        usedLeave: 3,
        role: "employee"
      });
      console.log("Seeded sample Employee (rahul@gmail.com / password123).");
    }
  } catch (error) {
    console.error("Error seeding initial data:", error.message);
  }
}

module.exports = connectDB;
