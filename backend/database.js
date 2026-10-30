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
    // 1. Seed Leave Types if none exist
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

    // 2. Seed Sample Employees if none exist
    const employeeCount = await Employee.countDocuments();
    if (employeeCount === 0) {
      const sampleEmployees = [
        {
          employeeId: "EMP001",
          name: "Aanchal",
          email: "rahul@gmail.com",
          password: "password123",
          phone: "9876543210",
          department: "IT",
          designation: "Software Engineer",
          emailVerified: true,
          totalLeave: 24,
          usedLeave: 3
        },
        {
          employeeId: "EMP002",
          name: "Priya Verma",
          email: "priya@gmail.com",
          password: "password123",
          phone: "9876543211",
          department: "HR",
          designation: "HR Executive",
          emailVerified: true,
          totalLeave: 24,
          usedLeave: 2
        },
        {
          employeeId: "EMP003",
          name: "Aman Kumar",
          email: "aman@gmail.com",
          password: "password123",
          phone: "9876543212",
          department: "Finance",
          designation: "Accountant",
          emailVerified: true,
          totalLeave: 24,
          usedLeave: 0
        },
        {
          employeeId: "EMP004",
          name: "Neha Singh",
          email: "neha@gmail.com",
          password: "password123",
          phone: "9876543213",
          department: "Marketing",
          designation: "Marketing Specialist",
          emailVerified: true,
          totalLeave: 24,
          usedLeave: 5
        },
        {
          employeeId: "EMP005",
          name: "Riya Gupta",
          email: "riya@gmail.com",
          password: "password123",
          phone: "9876543214",
          department: "Sales",
          designation: "Sales Associate",
          emailVerified: true,
          totalLeave: 24,
          usedLeave: 0
        }
      ];

      await Employee.insertMany(sampleEmployees);
      console.log("Seeded sample Employees.");

      // 3. Seed Sample Leave Requests
      const sampleRequests = [
        {
          employeeId: "EMP001",
          employeeName: "Rahul Sharma",
          leaveType: "Casual Leave",
          fromDate: "2026-10-01",
          toDate: "2026-10-03",
          numberOfDays: 3,
          reason: "Attending family function",
          status: "Approved",
          adminResponse: "Approved. Enjoy your leave!"
        },
        {
          employeeId: "EMP002",
          employeeName: "Priya Verma",
          leaveType: "Sick Leave",
          fromDate: "2026-10-05",
          toDate: "2026-10-06",
          numberOfDays: 2,
          reason: "Fever and rest recommended by doctor",
          status: "Approved",
          adminResponse: "Approved. Take rest."
        },
        {
          employeeId: "EMP003",
          employeeName: "Aman Kumar",
          leaveType: "Earned Leave",
          fromDate: "2026-10-10",
          toDate: "2026-10-12",
          numberOfDays: 3,
          reason: "Personal vacation",
          status: "Pending",
          adminResponse: ""
        },
        {
          employeeId: "EMP004",
          employeeName: "Neha Singh",
          leaveType: "Casual Leave",
          fromDate: "2026-09-15",
          toDate: "2026-09-19",
          numberOfDays: 5,
          reason: "Travel out of station",
          status: "Approved",
          adminResponse: "Approved."
        },
        {
          employeeId: "EMP005",
          employeeName: "Riya Gupta",
          leaveType: "Other",
          fromDate: "2026-10-20",
          toDate: "2026-10-21",
          numberOfDays: 2,
          reason: "Urgent domestic work",
          status: "Rejected",
          adminResponse: "Project deadline week. Please reschedule."
        }
      ];

      await LeaveRequest.insertMany(sampleRequests);
      console.log("Seeded sample Leave Requests.");
    }
  } catch (error) {
    console.error("Error seeding sample data:", error.message);
  }
}

module.exports = connectDB;
