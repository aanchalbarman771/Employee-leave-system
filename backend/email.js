const dns = require("dns");
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {
  // Ignore if not supported in older node versions
}

const nodemailer = require("nodemailer");

async function sendOTPEmail(userEmail, otp) {
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  
  console.log(`\n==========================================`);
  console.log(`[OTP GENERATED] Target Email: ${normalizedEmail}`);
  console.log(`[OTP CODE]: ${otp}`);
  console.log(`==========================================\n`);

  const emailUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : "";
  const rawPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : "";
  const emailPass = rawPass.replace(/\s+/g, ""); // Remove spaces from Google App Password

  const isPlaceholder = !emailUser || 
    emailUser.includes("yourgmail") || 
    !emailPass || 
    emailPass.includes("your_app_password");

  if (isPlaceholder) {
    console.log("❌ [EMAIL DELIVERABILITY WARNING]");
    console.log("-> Real email NOT sent because EMAIL_USER or EMAIL_PASS in backend/.env has placeholder values.");
    return { 
      success: false, 
      sentToMail: false, 
      error: "EMAIL_USER / EMAIL_PASS not configured in backend/.env." 
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // TLS
      auth: {
        user: emailUser,
        pass: emailPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"Employee Leave System" <${emailUser}>`,
      to: normalizedEmail,
      subject: `${otp} is your verification OTP - Employee Leave System`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 28px; color: #2d241e; max-width: 500px; margin: 0 auto; border: 1px solid #e7ded7; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 50px; height: 50px; line-height: 50px; border-radius: 12px; background-color: #d8c3a5; font-size: 24px; margin-bottom: 10px;">🏛️</div>
            <h2 style="color: #4a3728; margin: 0; font-size: 22px; font-weight: 700;">Employee Leave System</h2>
            <p style="color: #8c7a6b; font-size: 14px; margin-top: 4px;">Security Verification Code</p>
          </div>
          <hr style="border: none; border-top: 1px solid #f0e9e2; margin: 16px 0;" />
          <p style="font-size: 15px; color: #4a3728;">Hello,</p>
          <p style="font-size: 14px; color: #5a493c;">Your 6-digit One-Time Password (OTP) code is:</p>
          <div style="background-color: #fbf9f6; border: 2px dashed #b89f81; padding: 18px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #4a3728; font-family: monospace;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #7a6858;">⏱️ This OTP is valid for <strong>10 minutes</strong>. Please enter this code on the screen to proceed.</p>
          <p style="font-size: 12px; color: #a89a8d; margin-top: 24px;">If you did not request this OTP code, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #f0e9e2; margin: 20px 0;" />
          <p style="font-size: 12px; color: #a89a8d; text-align: center;">Employee Leave Management System &copy; 2026</p>
        </div>
      `,
      text: `Employee Leave System\n\nYour 6-digit verification OTP code is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nEmployee Leave Management System`
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ [EMAIL SENT] OTP successfully delivered to inbox: ${normalizedEmail}`);
    return { success: true, sentToMail: true };
  } catch (error) {
    console.error(`❌ [EMAIL FAILED] Could not send email to ${normalizedEmail}:`, error.message);
    return { success: false, sentToMail: false, error: error.message };
  }
}

module.exports = { sendOTPEmail };
