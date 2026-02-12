import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding email templates...');

  /**
   * Author: Sanket
   * Initial email templates from lib/email.ts
   */
  const templates = [
    {
      name: 'Course Enrollment',
      slug: 'courseEnrollment',
      subject: 'Course Enrollment Confirmation',
      content: `
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
          <p>Hi \${userName},</p>
          <p>You have successfully enrolled in the following course:</p>
          
          <div class="course-info">
            <h3>\${courseTitle}</h3>
            <p>\${courseDescription}</p>
            <p><strong>Enrollment Date:</strong> \${enrollmentDate}</p>
          </div>
          
          <p>You can now access your course materials and start learning.</p>
          
          <div style="text-align: center;">
            <a href="\${courseUrl}" class="cta-button">Start Learning</a>
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
    },
    {
      name: 'Welcome Email',
      slug: 'welcome',
      subject: 'Welcome to KIDOKOOL',
      content: `
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
          <p>Hi \${userName},</p>
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
            <a href="\${platformUrl}" class="cta-button">Start Exploring</a>
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
    },
    {
      name: 'Password Reset',
      slug: 'passwordReset',
      subject: 'Password Reset Request',
      content: `
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
          <p>Hi \${userName},</p>
          <p>We received a request to reset your password. Click the button below to proceed:</p>
          
          <div style="text-align: center;">
            <a href="\${resetUrl}" class="cta-button">Reset Password</a>
          </div>
          
          <div class="notice">
            <p><strong>Important:</strong> This link will expire in \${expirationTime}.</p>
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
  `
    }
  ];

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { slug: template.slug },
      update: {},
      create: template,
    });
  }

  console.log('Seeding initial email provider...');
  await prisma.emailProvider.upsert({
    where: { name: 'SMTP (Default)' },
    update: {},
    create: {
      name: 'SMTP (Default)',
      type: 'smtp',
      isActive: true,
      isDefault: true,
      config: {
        host: process.env.EMAIL_HOST || 'smtp.example.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: (process.env.EMAIL_SECURE || 'false') === 'true',
        user: process.env.EMAIL_USER || 'user@example.com',
        pass: process.env.EMAIL_PASS || 'password'
      },
    },
  });

  console.log('Seeding global settings...');
  await prisma.emailGlobalSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      isSystemEnabled: true,
    },
  });

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
