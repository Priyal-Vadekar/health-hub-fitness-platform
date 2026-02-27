const nodemailer = require('nodemailer');
require("dotenv").config({ path: "../.env" });

// Use environment variables for security
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USER, // your email
        pass: process.env.MAIL_PASS  // your app password
    }
});

// HTML Email Template for Verification
const createVerificationEmailTemplate = (userName, verificationLink) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Health Hub</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
                text-align: center;
            }
            .welcome-text {
                font-size: 18px;
                color: #333;
                margin-bottom: 20px;
            }
            .verification-text {
                font-size: 16px;
                color: #666;
                margin-bottom: 30px;
                line-height: 1.6;
            }
            .verify-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                transition: transform 0.3s ease;
            }
            .verify-button:hover {
                transform: translateY(-2px);
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏋️ Health Hub</div>
                <h1>Welcome to Health Hub!</h1>
            </div>
            <div class="content">
                <div class="welcome-text">
                    Hello ${userName || 'there'}! 👋
                </div>
                <div class="verification-text">
                    Thank you for joining Health Hub! To complete your registration and start your fitness journey, 
                    please verify your email address by clicking the button below.
                </div>
                <a href="${verificationLink}" class="verify-button">
                    Verify Email Address
                </a>
                <div class="warning">
                    <strong>Important:</strong> This verification link will expire in 24 hours. 
                    If you didn't create an account with Health Hub, please ignore this email.
                </div>
                <div style="margin-top: 30px; color: #666; font-size: 14px;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${verificationLink}" style="color: #667eea; word-break: break-all;">${verificationLink}</a>
                </div>
            </div>
            <div class="footer">
                <p>© 2024 Health Hub. All rights reserved.</p>
                <p>This email was sent to you because you signed up for Health Hub.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// HTML Email Template for Announcements
const createAnnouncementEmailTemplate = (title, description, date) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Announcement - Health Hub</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
            }
            .announcement-title {
                font-size: 22px;
                color: #333;
                margin-bottom: 15px;
                font-weight: 600;
            }
            .announcement-description {
                font-size: 16px;
                color: #666;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            .announcement-date {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                color: #495057;
                font-size: 14px;
                margin-bottom: 30px;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
            .logo {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏋️ Health Hub</div>
                <h1>📢 New Announcement</h1>
            </div>
            <div class="content">
                <div class="announcement-title">${title}</div>
                <div class="announcement-description">${description}</div>
                <div class="announcement-date">
                    <strong>Date:</strong> ${new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}
                </div>
            </div>
            <div class="footer">
                <p>© 2024 Health Hub. All rights reserved.</p>
                <p>You received this email because you are a member of Health Hub.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send verification email
exports.sendVerificationEmail = async (email, userName, verificationToken) => {
    // For now, use verification code instead of link
    const verificationCode = verificationToken.substring(0, 6).toUpperCase(); // Use first 6 characters as code

    const mailOptions = {
        from: `"Health Hub" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "🔐 Verify Your Email - Health Hub",
        html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification - Health Hub</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: #f4f4f4;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 10px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
              }
              .header h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: 600;
              }
              .content {
                  padding: 40px 30px;
                  text-align: center;
              }
              .welcome-text {
                  font-size: 18px;
                  color: #333;
                  margin-bottom: 20px;
              }
              .verification-text {
                  font-size: 16px;
                  color: #666;
                  margin-bottom: 30px;
                  line-height: 1.6;
              }
              .verification-code {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 20px;
                  border-radius: 10px;
                  font-size: 32px;
                  font-weight: bold;
                  letter-spacing: 5px;
                  margin: 20px 0;
                  display: inline-block;
                  min-width: 200px;
              }
              .footer {
                  background-color: #f8f9fa;
                  padding: 20px;
                  text-align: center;
                  color: #666;
                  font-size: 14px;
              }
              .logo {
                  font-size: 24px;
                  font-weight: bold;
                  margin-bottom: 10px;
              }
              .warning {
                  background-color: #fff3cd;
                  border: 1px solid #ffeaa7;
                  border-radius: 5px;
                  padding: 15px;
                  margin: 20px 0;
                  color: #856404;
                  font-size: 14px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="logo">🏋️ Health Hub</div>
                  <h1>Welcome to Health Hub!</h1>
              </div>
              <div class="content">
                  <div class="welcome-text">
                      Hello ${userName || 'there'}! 👋
                  </div>
                  <div class="verification-text">
                      Thank you for joining Health Hub! To complete your registration and start your fitness journey, 
                      please use the verification code below.
                  </div>
                  <div class="verification-code">
                      ${verificationCode}
                  </div>
                  <div class="warning">
                      <strong>Important:</strong> This verification code will expire in 24 hours. 
                      If you didn't create an account with Health Hub, please ignore this email.
                  </div>
                  <div style="margin-top: 30px; color: #666; font-size: 14px;">
                      Enter this code on the verification page to complete your registration.
                  </div>
              </div>
              <div class="footer">
                  <p>© 2024 Health Hub. All rights reserved.</p>
                  <p>This email was sent to you because you signed up for Health Hub.</p>
              </div>
          </div>
      </body>
      </html>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Verification email sent successfully to:", email);
    } catch (error) {
        console.error("Failed to send verification email:", error);
        throw error;
    }
};

/*
// Original link-based template (commented out for now)
const createVerificationEmailTemplate = (userName, verificationLink) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Health Hub</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
                text-align: center;
            }
            .welcome-text {
                font-size: 18px;
                color: #333;
                margin-bottom: 20px;
            }
            .verification-text {
                font-size: 16px;
                color: #666;
                margin-bottom: 30px;
                line-height: 1.6;
            }
            .verify-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                transition: transform 0.3s ease;
            }
            .verify-button:hover {
                transform: translateY(-2px);
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏋️ Health Hub</div>
                <h1>Welcome to Health Hub!</h1>
            </div>
            <div class="content">
                <div class="welcome-text">
                    Hello ${userName || 'there'}! 👋
                </div>
                <div class="verification-text">
                    Thank you for joining Health Hub! To complete your registration and start your fitness journey, 
                    please verify your email address by clicking the button below.
                </div>
                <a href="${verificationLink}" class="verify-button">
                    Verify Email Address
                </a>
                <div class="warning">
                    <strong>Important:</strong> This verification link will expire in 24 hours. 
                    If you didn't create an account with Health Hub, please ignore this email.
                </div>
                <div style="margin-top: 30px; color: #666; font-size: 14px;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${verificationLink}" style="color: #667eea; word-break: break-all;">${verificationLink}</a>
                </div>
            </div>
            <div class="footer">
                <p>© 2024 Health Hub. All rights reserved.</p>
                <p>This email was sent to you because you signed up for Health Hub.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
*/

// Send announcement email
exports.sendAnnouncementEmail = async (recipients, subject, message) => {
    const mailOptions = {
        from: `"Health Hub" <${process.env.MAIL_USER}>`,
        to: recipients.join(','), // Array of emails
        subject: subject,
        html: message // Use the improved HTML template
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Announcement emails sent successfully");
    } catch (error) {
        console.error("Failed to send announcement emails:", error);
        throw error;
    }
};

// Send password reset email
exports.sendPasswordResetEmail = async (email, userName, resetToken) => {
    // const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    const mailOptions = {
        from: `"Health Hub" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "🔑 Reset Your Password - Health Hub",
        html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - Health Hub</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: #f4f4f4;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 10px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
              }
              .header h1 {
                  margin: 0;
                  font-size: 24px;
                  font-weight: 600;
              }
              .content {
                  padding: 40px 30px;
                  text-align: center;
              }
              .reset-text {
                  font-size: 16px;
                  color: #666;
                  margin-bottom: 30px;
                  line-height: 1.6;
              }
              .reset-button {
                  display: inline-block;
                  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                  color: white;
                  padding: 15px 30px;
                  text-decoration: none;
                  border-radius: 25px;
                  font-weight: 600;
                  font-size: 16px;
                  margin: 20px 0;
                  transition: transform 0.3s ease;
              }
              .reset-button:hover {
                  transform: translateY(-2px);
              }
              .footer {
                  background-color: #f8f9fa;
                  padding: 20px;
                  text-align: center;
                  color: #666;
                  font-size: 14px;
              }
              .warning {
                  background-color: #fff3cd;
                  border: 1px solid #ffeaa7;
                  border-radius: 5px;
                  padding: 15px;
                  margin: 20px 0;
                  color: #856404;
                  font-size: 14px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🔑 Password Reset Request</h1>
              </div>
              <div class="content">
                  <div class="reset-text">
                      Hello ${userName || 'there'}!<br><br>
                      We received a request to reset your password for your Health Hub account. 
                      Click the button below to create a new password.
                  </div>
                  <a href="${resetLink}" class="reset-button">
                      Reset Password
                  </a>
                  <div class="warning">
                      <strong>Important:</strong> This link will expire in 1 hour. 
                      If you didn't request a password reset, please ignore this email.
                  </div>
                  <div style="margin-top: 30px; color: #666; font-size: 14px;">
                      If the button doesn't work, copy and paste this link into your browser:<br>
                      <a href="${resetLink}" style="color: #dc3545; word-break: break-all;">${resetLink}</a>
                  </div>
              </div>
              <div class="footer">
                  <p>© 2024 Health Hub. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Password reset email sent successfully to:", email);
    } catch (error) {
        console.error("Failed to send password reset email:", error);
        throw error;
    }
};
