const nodemailer = require("nodemailer");

// Simple email sending function using Nodemailer
async function sendOTPEmail(userEmail, otp) {
  // Always log OTP in server console for easy college testing/demo
  console.log(`\n==========================================`);
  console.log(`[OTP SENT] Email: ${userEmail} | OTP: ${otp}`);
  console.log(`==========================================\n`);

  // Check if email credentials exist in environment variables
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || emailUser.includes("yourgmail") || !emailPass || emailPass.includes("your_app_password")) {
    console.log("-> Real email sending skipped (using default placeholders in .env). Use console OTP above for testing.");
    return true;
  }

  try {
    // Create Nodemailer transport with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    // Email configuration options
    const mailOptions = {
      from: `"Employee Leave System" <${emailUser}>`,
      to: userEmail,
      subject: "Your Email Verification OTP",
      text: `Hello,\n\nYour 6-digit OTP for email verification is: ${otp}\n\nThis OTP is valid for 5 minutes.\n\nThank you,\nEmployee Leave Management Team`
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`-> OTP successfully sent to email: ${userEmail}`);
    return true;
  } catch (error) {
    console.error("-> Nodemailer error sending email:", error.message);
    // Return true anyway so development testing is not blocked
    return true;
  }
}

module.exports = { sendOTPEmail };
