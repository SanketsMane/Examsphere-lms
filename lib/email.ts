/**
 * Professional Email Service using Nodemailer
 * Minimalist templates without gradients - Author: Sanket
 */

// @ts-ignore
import nodemailer from 'nodemailer';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface TemplateData {
  [key: string]: string | number;
}

/**
 * Create nodemailer transporter based on configuration
 */
function createTransporter() {
  const service = (process.env.EMAIL_SERVICE || '').trim();

  if (service === 'gmail') {
    // Gmail configuration
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: (process.env.EMAIL_USER || '').trim(),
        pass: (process.env.EMAIL_PASS || '').trim()
      }
    });
  } else {
    // Custom SMTP configuration
    return nodemailer.createTransport({
      host: (process.env.EMAIL_HOST || '').trim(),
      port: parseInt((process.env.EMAIL_PORT || '587').trim()),
      secure: (process.env.EMAIL_SECURE || 'false').trim() === 'true',
      auth: {
        user: (process.env.EMAIL_USER || '').trim(),
        pass: (process.env.EMAIL_PASS || '').trim()
      }
    });
  }
}

/**
 * Minimalist email templates - Professional design without gradients
 * Author: Sanket
 */
const emailTemplates = {
  courseEnrollment: (data: TemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Course Enrollment Confirmation</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; }
        .header { background: #ffffff; padding: 32px 40px; border-bottom: 1px solid #e5e5e5; }
        .logo { font-size: 20px; font-weight: 700; color: #000000; margin-bottom: 8px; }
        .content { padding: 40px; }
        .title { font-size: 18px; font-weight: 600; color: #000000; margin-bottom: 16px; }
        .course-info { background: #f9f9f9; padding: 24px; border: 1px solid #e5e5e5; margin: 24px 0; }
        .course-info h3 { font-size: 16px; font-weight: 600; color: #000000; margin: 0 0 12px 0; }
        .course-info p { font-size: 14px; color: #666666; margin: 8px 0; }
        .cta-button { display: inline-block; background: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: 500; margin: 20px 0; }
        .footer { border-top: 1px solid #e5e5e5; padding: 32px 40px; background: #fafafa; text-align: center; }
        .footer-text { font-size: 13px; color: #666666; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">KIDOKOOL</div>
        </div>
        
        <div class="content">
          <h1 class="title">Course Enrollment Confirmation</h1>
          <p>Hi ${data.userName},</p>
          <p>You have successfully enrolled in the following course:</p>
          
          <div class="course-info">
            <h3>${data.courseTitle}</h3>
            <p>${data.courseDescription}</p>
            <p><strong>Enrollment Date:</strong> ${data.enrollmentDate}</p>
          </div>
          
          <p>You can now access your course materials and start learning.</p>
          
          <div style="text-align: center;">
            <a href="${data.courseUrl}" class="cta-button">Start Learning</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text"><strong>KIDOKOOL</strong></div>
          <div class="footer-text">Learning Management System</div>
          <div class="footer-text">© 2026 KIDOKOOL. All rights reserved.</div>
        </div>
      </div>
    </body>
    </html>
  `,

  welcome: (data: TemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Welcome to KIDOKOOL</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; }
        .header { background: #ffffff; padding: 32px 40px; border-bottom: 1px solid #e5e5e5; }
        .logo { font-size: 20px; font-weight: 700; color: #000000; margin-bottom: 8px; }
        .content { padding: 40px; }
        .title { font-size: 18px; font-weight: 600; color: #000000; margin-bottom: 16px; }
        .feature { padding: 16px 0; border-bottom: 1px solid #f0f0f0; }
        .feature:last-child { border-bottom: none; }
        .feature h4 { font-size: 15px; font-weight: 600; color: #000000; margin: 0 0 8px 0; }
        .feature p { font-size: 14px; color: #666666; margin: 0; }
        .cta-button { display: inline-block; background: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: 500; margin: 20px 0; }
        .footer { border-top: 1px solid #e5e5e5; padding: 32px 40px; background: #fafafa; text-align: center; }
        .footer-text { font-size: 13px; color: #666666; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">KIDOKOOL</div>
        </div>
        
        <div class="content">
          <h1 class="title">Welcome to KIDOKOOL</h1>
          <p>Hi ${data.userName},</p>
          <p>Welcome to our learning platform. We're excited to have you on board.</p>
          
          <div class="feature">
            <h4>📚 Access Quality Courses</h4>
            <p>Explore our extensive library of professional courses.</p>
          </div>
          
          <div class="feature">
            <h4>🎓 Learn at Your Own Pace</h4>
            <p>Study whenever and wherever you want.</p>
          </div>
          
          <div class="feature">
            <h4>💬 Community Support</h4>
            <p>Connect with fellow learners and instructors.</p>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${data.platformUrl}" class="cta-button">Start Exploring</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text"><strong>KIDOKOOL</strong></div>
          <div class="footer-text">Learning Management System</div>
          <div class="footer-text">© 2026 KIDOKOOL. All rights reserved.</div>
        </div>
      </div>
    </body>
    </html>
  `,

  passwordReset: (data: TemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Password Reset</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; }
        .header { background: #ffffff; padding: 32px 40px; border-bottom: 1px solid #e5e5e5; }
        .logo { font-size: 20px; font-weight: 700; color: #000000; margin-bottom: 8px; }
        .content { padding: 40px; }
        .title { font-size: 18px; font-weight: 600; color: #000000; margin-bottom: 16px; }
        .notice { background: #fafafa; border-left: 3px solid #000000; padding: 16px 20px; margin: 20px 0; }
        .notice p { font-size: 14px; color: #333333; margin: 0; }
        .cta-button { display: inline-block; background: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: 500; margin: 20px 0; }
        .footer { border-top: 1px solid #e5e5e5; padding: 32px 40px; background: #fafafa; text-align: center; }
        .footer-text { font-size: 13px; color: #666666; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">KIDOKOOL</div>
        </div>
        
        <div class="content">
          <h1 class="title">Password Reset Request</h1>
          <p>Hi ${data.userName},</p>
          <p>We received a request to reset your password. Click the button below to proceed:</p>
          
          <div style="text-align: center;">
            <a href="${data.resetUrl}" class="cta-button">Reset Password</a>
          </div>
          
          <div class="notice">
            <p><strong>Important:</strong> This link will expire in ${data.expirationTime || '1 hour'}.</p>
          </div>
          
          <div class="notice">
            <p><strong>Security Note:</strong> If you didn't request this, please ignore this email.</p>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text"><strong>KIDOKOOL</strong></div>
          <div class="footer-text">Learning Management System</div>
          <div class="footer-text">© 2026 KIDOKOOL. All rights reserved.</div>
        </div>
      </div>
    </body>
    </html>
  `,

  notification: (data: TemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Notification</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; }
        .header { background: #ffffff; padding: 32px 40px; border-bottom: 1px solid #e5e5e5; }
        .logo { font-size: 20px; font-weight: 700; color: #000000; margin-bottom: 8px; }
        .content { padding: 40px; }
        .title { font-size: 18px; font-weight: 600; color: #000000; margin-bottom: 16px; }
        .notification-box { background: #f9f9f9; border: 1px solid #e5e5e5; padding: 24px; margin: 20px 0; }
        .notification-box h3 { font-size: 16px; font-weight: 600; color: #000000; margin: 0 0 12px 0; }
        .notification-box p { font-size: 14px; color: #333333; margin: 0; }
        .footer { border-top: 1px solid #e5e5e5; padding: 32px 40px; background: #fafafa; text-align: center; }
        .footer-text { font-size: 13px; color: #666666; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">KIDOKOOL</div>
        </div>
        
        <div class="content">
          <h1 class="title">${data.title || 'Notification'}</h1>
          <p>Hi ${data.userName},</p>
          
          <div class="notification-box">
            <h3>${data.messageTitle}</h3>
            <p>${data.message}</p>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text"><strong>KIDOKOOL</strong></div>
          <div class="footer-text">Learning Management System</div>
          <div class="footer-text">© 2026 KIDOKOOL. All rights reserved.</div>
        </div>
      </div>
    </body>
    </html>
  `,

  receipt: (data: TemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Purchase Receipt</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; }
        .header { background: #ffffff; padding: 32px 40px; border-bottom: 1px solid #e5e5e5; }
        .logo { font-size: 20px; font-weight: 700; color: #000000; margin-bottom: 8px; }
        .content { padding: 40px; }
        .title { font-size: 18px; font-weight: 600; color: #000000; margin-bottom: 16px; }
        .receipt-table { width: 100%; border: 1px solid #e5e5e5; margin: 20px 0; }
        .receipt-row { display: flex; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #f0f0f0; }
        .receipt-row:last-child { border-bottom: none; background: #fafafa; font-weight: 600; }
        .receipt-row span { font-size: 14px; color: #333333; }
        .footer { border-top: 1px solid #e5e5e5; padding: 32px 40px; background: #fafafa; text-align: center; }
        .footer-text { font-size: 13px; color: #666666; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">KIDOKOOL</div>
        </div>
        
        <div class="content">
          <h1 class="title">Payment Receipt</h1>
          <p>Hi ${data.userName},</p>
          <p>Thank you for your purchase. Here are your receipt details:</p>
          
          <div class="receipt-table">
            <div class="receipt-row">
              <span>Course:</span>
              <span>${data.courseTitle}</span>
            </div>
            <div class="receipt-row">
              <span>Purchase Date:</span>
              <span>${data.purchaseDate}</span>
            </div>
            <div class="receipt-row">
              <span>Transaction ID:</span>
              <span>${data.transactionId}</span>
            </div>
            <div class="receipt-row">
              <span>Amount Paid:</span>
              <span>$${data.amount}</span>
            </div>
          </div>
          
          <p>You can now access your course and start learning.</p>
        </div>
        
        <div class="footer">
          <div class="footer-text"><strong>KIDOKOOL</strong></div>
          <div class="footer-text">Learning Management System</div>
          <div class="footer-text">© 2026 KIDOKOOL. All rights reserved.</div>
        </div>
      </div>
    </body>
    </html>
  `,

  teacherVerificationSubmission: (data: TemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Teacher Verification Submission</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; }
        .header { background: #ffffff; padding: 32px 40px; border-bottom: 1px solid #e5e5e5; }
        .logo { font-size: 20px; font-weight: 700; color: #000000; margin-bottom: 8px; }
        .content { padding: 40px; }
        .title { font-size: 18px; font-weight: 600; color: #000000; margin-bottom: 16px; }
        .doc-section { background: #f9f9f9; border: 1px solid #e5e5e5; padding: 20px; margin: 16px 0; }
        .doc-section h3 { font-size: 15px; font-weight: 600; color: #000000; margin: 0 0 12px 0; }
        .doc-section p { font-size: 14px; color: #666666; margin: 0; }
        .cta-button { display: inline-block; background: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: 500; margin: 20px 0; }
        .footer { border-top: 1px solid #e5e5e5; padding: 32px 40px; background: #fafafa; text-align: center; }
        .footer-text { font-size: 13px; color: #666666; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">KIDOKOOL</div>
        </div>
        
        <div class="content">
          <h1 class="title">Teacher Verification Request</h1>
          <p>Hi Admin,</p>
          <p><strong>${data.teacherName}</strong> (${data.teacherEmail}) has submitted documents for verification.</p>
          
          <div class="doc-section">
            <h3>Identity Document</h3>
            <p>${data.identityDocHtml}</p>
          </div>

          <div class="doc-section">
            <h3>Qualifications</h3>
            <p>${data.qualificationDocsHtml}</p>
          </div>

          <div class="doc-section">
            <h3>Experience</h3>
            <p>${data.experienceDocsHtml}</p>
          </div>
          
          <p>Please review these documents in the admin dashboard.</p>
          
          <div style="text-align: center;">
            <a href="${data.adminDashboardUrl}" class="cta-button">Go to Admin Dashboard</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text"><strong>KIDOKOOL</strong></div>
          <div class="footer-text">Admin Notification</div>
          <div class="footer-text">© 2026 KIDOKOOL. All rights reserved.</div>
        </div>
      </div>
    </body>
    </html>
  `,

  courseSubmission: (data: TemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>New Course Submission</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; }
        .header { background: #ffffff; padding: 32px 40px; border-bottom: 1px solid #e5e5e5; }
        .logo { font-size: 20px; font-weight: 700; color: #000000; margin-bottom: 8px; }
        .content { padding: 40px; }
        .title { font-size: 18px; font-weight: 600; color: #000000; margin-bottom: 16px; }
        .info-box { background: #f9f9f9; border: 1px solid #e5e5e5; padding: 20px; margin: 20px 0; }
        .info-box p { font-size: 14px; color: #333333; margin: 8px 0; }
        .cta-button { display: inline-block; background: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: 500; margin: 20px 0; }
        .footer { border-top: 1px solid #e5e5e5; padding: 32px 40px; background: #fafafa; text-align: center; }
        .footer-text { font-size: 13px; color: #666666; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">KIDOKOOL</div>
        </div>
        
        <div class="content">
          <h1 class="title">New Course Submitted</h1>
          <p>Hi Admin,</p>
          <p>A new course has been submitted for review.</p>
          
          <div class="info-box">
            <p><strong>Course Title:</strong> ${data.courseTitle}</p>
            <p><strong>Instructor:</strong> ${data.teacherName} (${data.teacherEmail})</p>
          </div>
          
          <p>Please review the course content and approve or reject it.</p>
          
          <div style="text-align: center;">
            <a href="${data.courseLink}" class="cta-button">Review Course</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text"><strong>KIDOKOOL</strong></div>
          <div class="footer-text">Admin Notification</div>
          <div class="footer-text">© 2026 KIDOKOOL. All rights reserved.</div>
        </div>
      </div>
    </body>
    </html>
  `,

  teacherApproved: (data: TemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Teacher Profile Approved</title>
      <style>
        body { font-family: sans-serif; background-color: #f5f5f5; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; padding: 40px; }
        .cta-button { display: inline-block; background: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>You're Approved!</h1>
        <p>Hi ${data.userName},</p>
        <p>Your teacher profile has been approved.</p>
        <div style="text-align: center;">
          <a href="${data.dashboardUrl}" class="cta-button">Go to Dashboard</a>
        </div>
      </div>
    </body>
    </html>
  `,

  teacherRejected: (data: TemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Teacher Application Update</title>
      <style>
        body { font-family: sans-serif; background-color: #f5f5f5; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; padding: 40px; }
        .reason { background: #fff0f0; padding: 20px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Application Update</h1>
        <p>Hi ${data.userName},</p>
        <p>We are unable to approve your application at this time.</p>
        <div class="reason">
          <strong>Reason:</strong><br/>
          ${data.reason}
        </div>
      </div>
    </body>
    </html>
  `,
  
  sessionReminder24h: (data: TemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Session Reminder - 24 Hours</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; }
        .header { background: #ffffff; padding: 32px 40px; border-bottom: 1px solid #e5e5e5; }
        .logo { font-size: 20px; font-weight: 700; color: #000000; margin-bottom: 8px; }
        .content { padding: 40px; }
        .title { font-size: 18px; font-weight: 600; color: #000000; margin-bottom: 16px; }
        .session-info { background: #f9f9f9; padding: 24px; border: 1px solid #e5e5e5; margin: 24px 0; }
        .session-info h3 { font-size: 16px; font-weight: 600; color: #000000; margin: 0 0 12px 0; }
        .session-info p { font-size: 14px; color: #666666; margin: 8px 0; }
        .cta-button { display: inline-block; background: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: 500; margin: 20px 0; }
        .footer { border-top: 1px solid #e5e5e5; padding: 32px 40px; background: #fafafa; text-align: center; }
        .footer-text { font-size: 13px; color: #666666; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">KIDOKOOL</div>
        </div>
        
        <div class="content">
          <h1 class="title">Session Reminder: 24 Hours to Go</h1>
          <p>Hi ${data.userName},</p>
          <p>Just a friendly reminder that your session with <strong>${data.teacherName}</strong> is scheduled for tomorrow.</p>
          
          <div class="session-info">
            <h3>${data.sessionTitle}</h3>
            <p><strong>Time:</strong> ${data.sessionTimeDisplay}</p>
            <p><strong>Duration:</strong> ${data.duration} minutes</p>
          </div>
          
          <p>Make sure you're prepared and ready to join at the scheduled time.</p>
          
          <div style="text-align: center;">
            <a href="${data.sessionUrl}" class="cta-button">View Session Details</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text"><strong>KIDOKOOL</strong></div>
          <div class="footer-text">Learning Management System</div>
          <div class="footer-text">© 2026 KIDOKOOL. All rights reserved.</div>
        </div>
      </div>
    </body>
    </html>
  `,

  sessionReminder1h: (data: TemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Starting Soon - 1 Hour Reminder</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; }
        .header { background: #ffffff; padding: 32px 40px; border-bottom: 1px solid #e5e5e5; }
        .logo { font-size: 20px; font-weight: 700; color: #000000; margin-bottom: 8px; }
        .content { padding: 40px; }
        .title { font-size: 18px; font-weight: 600; color: #000000; margin-bottom: 16px; }
        .starting-soon { background: #f0f0f0; border-left: 4px solid #000000; padding: 20px; margin: 24px 0; }
        .starting-soon p { font-size: 15px; font-weight: 600; color: #000000; margin: 0; }
        .session-details { color: #666666; font-size: 14px; margin: 20px 0; }
        .cta-button { display: inline-block; background: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: 500; margin: 20px 0; }
        .footer { border-top: 1px solid #e5e5e5; padding: 32px 40px; background: #fafafa; text-align: center; }
        .footer-text { font-size: 13px; color: #666666; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">KIDOKOOL</div>
        </div>
        
        <div class="content">
          <h1 class="title">Your Session starts in 1 hour!</h1>
          <p>Hi ${data.userName},</p>
          
          <div class="starting-soon">
            <p>Ready to go? Your session with ${data.teacherName} is starting soon.</p>
          </div>
          
          <div class="session-details">
            <p><strong>Session:</strong> ${data.sessionTitle}</p>
            <p><strong>Starts at:</strong> ${data.sessionTimeDisplay}</p>
          </div>
          
          <p>Please ensure your camera and microphone are working correctly.</p>
          
          <div style="text-align: center;">
            <a href="${data.sessionUrl}" class="cta-button">Join Session</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text"><strong>KIDOKOOL</strong></div>
          <div class="footer-text">Learning Management System</div>
          <div class="footer-text">© 2026 KIDOKOOL. All rights reserved.</div>
        </div>
      </div>
    </body>
    </html>
  `
};

/**
 * Send email using the configured transporter
 */
export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // Mock email sending for development if credentials refer to non-existent vars or just always for safety now
    if (!process.env.EMAIL_HOST && !process.env.EMAIL_USER) {
      console.log('---------------------------------------------------');
      console.log('EMAIL SENT (MOCKED):');
      console.log('To:', emailData.to);
      console.log('Subject:', emailData.subject);
      console.log('---------------------------------------------------');
      return true;
    }

    const transporter = createTransporter();

    // ... existing logic ...
    const mailOptions = {
      from: emailData.from || (process.env.EMAIL_FROM || '').trim() || (process.env.EMAIL_USER || '').trim(),
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send templated email
 */
export async function sendTemplatedEmail(
  template: keyof typeof emailTemplates,
  to: string,
  subject: string,
  data: TemplateData
): Promise<boolean> {
  const templateFunction = emailTemplates[template];
  if (!templateFunction) {
    console.error(`Template "${template}" not found`);
    return false;
  }

  const html = templateFunction(data);

  return await sendEmail({
    to,
    subject,
    html
  });
}