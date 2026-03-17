const nodemailer = require('nodemailer');
require('dotenv').config();

async function main() {
  const emailHost = (process.env.EMAIL_HOST || '').trim();
  const emailPort = parseInt((process.env.EMAIL_PORT || '587').trim());
  const emailSecure = (process.env.EMAIL_SECURE || 'false').trim() === 'true';
  const emailUser = (process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.EMAIL_PASS || '').trim();
  const emailFrom = (process.env.EMAIL_FROM || '').trim() || emailUser;

  console.log("Config:", { emailHost, emailPort, emailSecure, emailUser, emailFrom });

  const transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailSecure,
    auth: {
      user: emailUser,
      pass: emailPass
    },
    // Adding debug logging
    debug: true,
    logger: true
  });

  try {
    console.log("Attempting to send test email...");
    const info = await transporter.sendMail({
      from: emailFrom,
      to: emailUser, // Send to self
      subject: "Test Email from KIDOKOOL",
      text: "This is a test email to verify SMTP configuration.",
      html: "<b>This is a test email to verify SMTP configuration.</b>"
    });
    console.log("Email sent successfully!", info.messageId);
  } catch (error) {
    console.error("Failed to send email:", error);
  } finally {
    process.exit(0);
  }
}

main();
