import { sendTemplatedEmail, sendEmail } from '../lib/email';
import { prisma } from '../lib/db';

/**
 * Author: Sanket
 * Verification script for the new Email Management System
 */
async function runVerification() {
  console.log('--- STARTING EMAIL SYSTEM VERIFICATION ---');

  // 1. Test Global Toggle
  console.log('\n[1] Testing Global System Toggle:');
  await prisma.emailGlobalSettings.update({
    where: { id: 'default' },
    data: { isSystemEnabled: false }
  });
  console.log('System DISABLED. Sending email...');
  const disabledResult = await sendEmail({ to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' });
  console.log('Result (Should be true but skipped):', disabledResult);

  await prisma.emailGlobalSettings.update({
    where: { id: 'default' },
    data: { isSystemEnabled: true }
  });
  console.log('System ENABLED again.');

  // 2. Test Template Fetching and Placeholder Replacement
  console.log('\n[2] Testing Template Fetching:');
  const templateSlug = 'courseEnrollment';
  const testData = {
    userName: 'Tester User',
    courseTitle: 'Verification Course',
    courseDescription: 'Testing database templates',
    courseUrl: 'https://example.com/course',
    enrollmentDate: new Date().toLocaleDateString()
  };

  console.log(`Triggering templated email for "${templateSlug}"...`);
  // Note: This will log to console if no SMTP credentials are found in DB provider
  const templateResult = await sendTemplatedEmail(templateSlug, 'student@example.com', 'Welcome!', testData);
  console.log('Result:', templateResult);

  // 3. Test Service Configuration
  console.log('\n[3] Testing Service Provider:');
  const activeProvider = await prisma.emailProvider.findFirst({ where: { isActive: true } });
  console.log('Active Provider:', activeProvider?.name);
  console.log('Type:', activeProvider?.type);

  console.log('\n--- VERIFICATION COMPLETE ---');
}

runVerification()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
