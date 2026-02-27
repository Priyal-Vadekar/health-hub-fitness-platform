// D:\Projects\Main Project\healthhub\backend\utils\sendEmail.js
const nodemailer = require("nodemailer");

const sendEmail = async ({ email, subject, message }) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: subject,
        text: message
    });
};

module.exports = sendEmail;
