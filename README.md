# Employee Leave Management System

A simple, beginner-friendly **Employee Leave Management System** created for a BCA college project. The system allows employees to register, verify their email via OTP, log in, apply for leaves, track leave status, and view/edit profile details. Administrators can review, approve, or reject leave requests, manage employees, and configure leave types.

---

## 🚀 Key Highlights & Viva Notes

> **Express.js is NOT used.**
> The backend server is built purely using Node.js's native `http` module (`http.createServer()`) with custom HTTP routing, JSON body parsing, and CORS header handling.

> **Tailwind CSS & Bootstrap are NOT used.**
> The frontend UI is styled using standard Vanilla CSS files (`App.css`, `Login.css`, `Dashboard.css`, `Form.css`, `Table.css`) with clean CSS variables.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, JavaScript, HTML, Vanilla CSS
- **Backend**: Node.js (Built-in `http` module)
- **Database**: MongoDB (via Mongoose for simple data schemas)
- **Email**: Nodemailer (Sends 6-digit OTP emails via Gmail SMTP)

---

## ✨ Features

### 👤 Employee Features:
1. **Registration**: Input Full Name, Email, Password, Phone, Department, Designation.
2. **Email OTP Verification**: 6-digit OTP sent via email (expires in 5 minutes).
3. **Login & Forgot Password**: Secure authentication using simple Node & MongoDB logic.
4. **Dashboard**: 4 metric cards (Total Leave: 24, Used Leave, Remaining Leave, Pending Requests) and recent leaves table.
5. **Apply Leave**: Select Leave Type, From Date, To Date, Reason. Automatically calculates number of days (`To Date - From Date + 1`).
6. **My Leaves**: Filterable list of past leave requests (Pending, Approved, Rejected).
7. **Profile Management**: View details & update Name, Phone, Department, Designation (Email remains locked as verified).

### 👑 Admin Features:
1. **Demo Admin Login**: Quick login using `admin@gmail.com` / `admin123`.
2. **Admin Dashboard**: 5 metric cards (Total Employees, Total Leave Requests, Pending, Approved, Rejected) and recent requests table.
3. **Leave Requests Management**: Approve or Reject employee requests with optional admin response text. Updates employee leave balance upon approval.
4. **Employee Management**: View all employees, search by Name or Employee ID, Add new employee, Edit employee, Delete employee.
5. **Leave Type Management**: Manage leave types (Casual Leave, Sick Leave, Earned Leave, Other) with Add, Edit, Delete capabilities.

---

## 📁 Project Structure

```text
Employee-Leave-Management/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── DashboardCard.jsx
│   │   │   └── StatusBadge.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── VerifyOTP.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── EmployeeDashboard.jsx
│   │   │   ├── ApplyLeave.jsx
│   │   │   ├── MyLeaves.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── LeaveRequests.jsx
│   │   │   ├── Employees.jsx
│   │   │   └── LeaveTypes.jsx
│   │   │
│   │   ├── App.css
│   │   ├── Login.css
│   │   ├── Dashboard.css
│   │   ├── Form.css
│   │   ├── Table.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── models/
│   │   ├── Employee.js
│   │   ├── LeaveRequest.js
│   │   ├── LeaveType.js
│   │   └── OTP.js
│   ├── database.js
│   ├── email.js
│   ├── server.js
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## ⚙️ Step-by-Step Installation & Setup

### Prerequisites
- Install **Node.js** (v16 or higher)
- Install and start **MongoDB Community Server** locally (`mongodb://127.0.0.1:27017`) or have a MongoDB Atlas Connection String.

---

### Step 1: Configure Backend Environment
Navigate into the `backend` folder and review/edit `.env`:

```bash
cd backend
```

`.env` configuration example:
```env
PORT=5000
MONGODB_URL=mongodb://127.0.0.1:27017/employee_leave_db
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_app_password
```

*(Note: If Gmail SMTP is not configured, generated OTPs are printed in the backend server console for easy testing during college demonstrations).*

---

### Step 2: Install Backend Dependencies & Start Server
In the `backend` directory, run:

```bash
npm install
npm start
```
The backend HTTP server will start at `http://localhost:5000`.

---

### Step 3: Install Frontend Dependencies & Start React App
Open a new terminal, navigate into the `frontend` folder, and run:

```bash
cd frontend
npm install
npm run dev
```
The React frontend application will launch at `http://localhost:3000`.

---

## 🔑 Demo Credentials for Viva / Testing

| Role | Email | Password |
| --- | --- | --- |
| **Admin** | `admin@gmail.com` | `admin123` |
| **Sample Employee 1** | `rahul@gmail.com` | `password123` |
| **Sample Employee 2** | `priya@gmail.com` | `password123` |
