import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding email templates...');

  /**
   * Author: Sanket
   * Comprehensive email templates for the system
   */
  const templates = [
    // --- Existing Templates ---
    {
      name: 'Course Enrollment',
      slug: 'courseEnrollment',
      subject: 'Course Enrollment Confirmation',
      isActive: true,
      content: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Course Enrollment Confirmation</title>
      <style>
        body { font-family: sans-serif; background-color: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; padding: 20px; }
        .button { background: #000; color: #fff; padding: 10px 20px; text-decoration: none; display: inline-block; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Course Enrollment Confirmation</h2>
        <p>Hi \${userName},</p>
        <p>You have successfully enrolled in <strong>\${courseTitle}</strong>.</p>
        <p>\${courseDescription}</p>
        <a href="\${courseUrl}" class="button">Start Learning</a>
      </div>
    </body>
    </html>
  `,
    },
    {
      name: 'Welcome Email',
      slug: 'welcome',
      subject: 'Welcome to KIDOKOOL',
      isActive: true,
      content: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to KIDOKOOL</title>
      <style>
        body { font-family: sans-serif; background-color: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome to KIDOKOOL!</h2>
        <p>Hi \${userName},</p>
        <p>We are excited to have you on board. Explore our courses and start learning today!</p>
        <a href="\${platformUrl}" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;">Go to Dashboard</a>
      </div>
    </body>
    </html>
  `,
    },
    {
      name: 'Password Reset',
      slug: 'passwordReset',
      subject: 'Password Reset Request',
      isActive: true,
      content: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset</title>
      <style>
        body { font-family: sans-serif; background-color: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Reset Your Password</h2>
        <p>Hi \${userName},</p>
        <p>Click the button below to reset your password. This link expires in \${expirationTime}.</p>
        <a href="\${resetUrl}" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;">Reset Password</a>
      </div>
    </body>
    </html>
  `
    },

    // --- Verification Templates ---
    {
        name: 'Document Verification Submitted',
        slug: 'documentVerificationSubmitted',
        subject: 'Documents Received - Under Review',
        isActive: true,
        content: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h3>Documents Received</h3>
            <p>Hi \${userName},</p>
            <p>We have received your documents for verification. Our team will review them shortly.</p>
            <p>You will be notified once the review is complete.</p>
        </body>
        </html>
        `
    },
    {
        name: 'Document Verification Approved',
        slug: 'documentVerificationApproved',
        subject: 'Documents Verified Successfully ✅',
        isActive: true,
        content: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h3>Verification Successful</h3>
            <p>Hi \${userName},</p>
            <p>Your documents have been verified successfully! You are one step closer to teaching on Kidokool.</p>
            <a href="\${dashboardUrl}" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;">Go to Dashboard</a>
        </body>
        </html>
        `
    },
    {
        name: 'Document Verification Rejected',
        slug: 'documentVerificationRejected',
        subject: 'Action Required: Document Verification Failed ❌',
        isActive: true,
        content: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h3>Verification Failed</h3>
            <p>Hi \${userName},</p>
            <p>Unfortunately, some of your documents could not be verified.</p>
            <p><strong>Reason:</strong> \${reason}</p>
            <p>Please log in and re-upload the correct documents.</p>
            <a href="\${dashboardUrl}" style="background:red;color:#fff;padding:10px 20px;text-decoration:none;">Fix Documents</a>
        </body>
        </html>
        `
    },
    {
        name: 'Teacher Profile Approved',
        slug: 'teacherVerificationApproved', // Matching the slug used in code or creating new standard
        subject: 'You are now an Instructor! 🎉',
        isActive: true,
        content: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h3>Welcome Instructor!</h3>
            <p>Hi \${userName},</p>
            <p>Congratulations! Your teacher profile has been approved.</p>
            <p>You can now create courses and schedule sessions.</p>
            <a href="\${dashboardUrl}" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;">Start Teaching</a>
        </body>
        </html>
        `
    },
    {
        name: 'Teacher Profile Rejected',
        slug: 'teacherVerificationRejected',
        subject: 'Update on your Instructor Application',
        isActive: true,
        content: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h3>Application Status</h3>
            <p>Hi \${userName},</p>
            <p>We regret to inform you that your instructor application was not approved at this time.</p>
            <p><strong>Reason:</strong> \${reason}</p>
            <p>If you have questions, please reply to this email.</p>
        </body>
        </html>
        `
    },

    // --- Payout Templates ---
    {
        name: 'Payout Requested',
        slug: 'payoutRequested',
        subject: 'Payout Request Received',
        isActive: true,
        content: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h3>Payout Request Received</h3>
            <p>Hi \${userName},</p>
            <p>We have received your payout request for <strong>\${amount}</strong>.</p>
            <p>It will be processed within 5-7 business days.</p>
        </body>
        </html>
        `
    },
    {
        name: 'Payout Processed',
        slug: 'payoutProcessed',
        subject: 'Payout Processed Successfully 💰',
        isActive: true,
        content: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h3>Money is on the way!</h3>
            <p>Hi \${userName},</p>
            <p>Your payout of <strong>\${amount}</strong> has been processed and sent to your bank account.</p>
            <p>Transaction Reference: \${referenceId}</p>
        </body>
        </html>
        `
    },

    // --- Payment Templates ---
    {
        name: 'Payment Successful',
        slug: 'paymentSuccessful',
        subject: 'Receipt for your payment',
        isActive: true,
        content: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h3>Payment Receipt</h3>
            <p>Hi \${userName},</p>
            <p>Thank you for your payment!</p>
            <p><strong>Item:</strong> \${itemName}</p>
            <p><strong>Amount:</strong> \${amount}</p>
            <p><strong>Transaction ID:</strong> \${transactionId}</p>
        </body>
        </html>
        `
    },
    {
        name: 'Payment Failed',
        slug: 'paymentFailed',
        subject: 'Payment Failed',
        isActive: true,
        content: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h3>Payment Failed</h3>
            <p>Hi \${userName},</p>
            <p>We were unable to process your payment for <strong>\${itemName}</strong>.</p>
            <p>Please try again or use a different payment method.</p>
        </body>
        </html>
        `
    },
    
    // --- Course Templates ---
    {
        name: 'Course Published',
        slug: 'coursePublished',
        subject: 'Your Course is Live! 🚀',
        isActive: true,
        content: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h3>Course Published</h3>
            <p>Hi \${userName},</p>
            <p>Great news! Your course <strong>\${courseTitle}</strong> has been approved and is now live on Kidokool.</p>
            <a href="\${courseUrl}" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;">View Course</a>
        </body>
        </html>
        `
    },
     { // Previously identified missing template for course submission notification to Admin
        name: 'New Course Submission (Admin)',
        slug: 'adminCourseSubmission',
        subject: 'New Course Submission: ${courseTitle}',
        isActive: true,
        content: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h3>New Course Submitted</h3>
            <p><strong>Teacher:</strong> \${teacherName} (\${teacherEmail})</p>
            <p><strong>Course:</strong> \${courseTitle}</p>
            <p>Please review it in the admin dashboard.</p>
            <a href="\${reviewUrl}" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;">Review Course</a>
        </body>
        </html>
        `
    },
     // Session Bookings (already in webhook code but good to ensure)
     {
        name: 'Booking Confirmation (Student)',
        slug: 'bookingConfirmation',
        subject: 'Booking Confirmed! ✅',
        isActive: true,
        content: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h3>Booking Confirmed</h3>
            <p>Hi \${userName},</p>
            <p>Your session <strong>\${sessionTitle}</strong> with \${teacherName} is confirmed.</p>
            <p><strong>Date:</strong> \${sessionDate} at \${sessionTime}</p>
            <a href="\${sessionUrl}" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;">Join Session</a>
        </body>
        </html>
        `
    },
    {
        name: 'New Booking Notification (Teacher)',
        slug: 'newBookingNotification',
        subject: 'New Session Booked! 🎉',
        isActive: true,
        content: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px;">
            <h3>New Booking</h3>
            <p>Hi \${teacherName},</p>
            <p>\${studentName} has booked a session: <strong>\${sessionTitle}</strong>.</p>
            <p><strong>Date:</strong> \${sessionDate} at \${sessionTime}</p>
            <a href="\${sessionUrl}" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;">View Details</a>
        </body>
        </html>
        `
    }
  ];

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { slug: template.slug },
      update: {
          // Update content if it exists to ensure new structure is applied
          // But maybe user customized it? 
          // For now, let's only create if missing, OR update if requested. 
          // The user specifically asked to "add that all", implying they are missing.
          // I will use upsert to ensure they exist.
          name: template.name,
          subject: template.subject,
          isActive: template.isActive,
          // content: template.content // Optional: Uncomment to force overwrite content
      },
      create: template,
    });
    console.log(`Processed template: ${template.name}`);
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
