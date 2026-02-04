import { prisma } from '@/lib/db';
import { sendTemplatedEmail } from '@/lib/email';
import { sendSessionReminderSMS } from './sms-service';

/**
 * Reminder Logic Engine
 * Author: Sanket
 */

export async function checkAndSendReminders() {
  const now = new Date();
  
  // 24 Hour Reminders (24h to 23h 45m window)
  const window24Start = new Date(now.getTime() + 23.75 * 60 * 60 * 1000);
  const window24End = new Date(now.getTime() + 24.25 * 60 * 60 * 1000);
  
  // 1 Hour Reminders (1h to 45m window)
  const window1Start = new Date(now.getTime() + 0.75 * 60 * 60 * 1000);
  const window1End = new Date(now.getTime() + 1.25 * 60 * 60 * 1000);

  console.log(`[Reminder Service] Checking reminders at ${now.toISOString()}`);

  // Fetch sessions scheduled for 24h reminders
  const sessions24h = await prisma.liveSession.findMany({
    where: {
      scheduledAt: { gte: window24Start, lte: window24End },
      status: 'scheduled',
      studentId: { not: null }
    },
    include: {
      student: { include: { notificationPreferences: true } },
      teacher: { include: { user: true } },
      sentNotifications: { where: { type: 'email_24h' } }
    }
  });

  // Fetch sessions scheduled for 1h reminders
  const sessions1h = await prisma.liveSession.findMany({
    where: {
      scheduledAt: { gte: window1Start, lte: window1End },
      status: 'scheduled',
      studentId: { not: null }
    },
    include: {
      student: { include: { notificationPreferences: true } },
      teacher: { include: { user: true } },
      sentNotifications: { where: { type: 'email_1h' } }
    }
  });

  // Process 24h reminders
  for (const session of sessions24h) {
    if (session.sentNotifications.length === 0) {
      await sendReminder(session, '24h');
    }
  }

  // Process 1h reminders
  for (const session of sessions1h) {
    if (session.sentNotifications.length === 0) {
      await sendReminder(session, '1h');
    }
  }
}

async function sendReminder(session: any, timeUntil: '24h' | '1h') {
  const { student, teacher } = session;
  if (!student || !student.email) return;

  const prefs = student.notificationPreferences || {
    emailReminders: true,
    email24hBefore: true,
    email1hBefore: true,
    smsReminders: false,
    sms24hBefore: false,
    sms1hBefore: false
  };

  const template = timeUntil === '24h' ? 'sessionReminder24h' : 'sessionReminder1h';
  const type = `email_${timeUntil}`;
  const smsType = `sms_${timeUntil}`;

  const sessionTimeDisplay = session.scheduledAt.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const sessionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sessions`;

  // Send Email
  if (prefs.emailReminders && (timeUntil === '24h' ? prefs.email24hBefore : prefs.email1hBefore)) {
    try {
      const success = await sendTemplatedEmail(template as any, student.email, `Session Reminder: ${session.title}`, {
        userName: student.name || 'Student',
        teacherName: teacher.user.name || 'Teacher',
        sessionTitle: session.title,
        sessionTimeDisplay,
        duration: session.duration,
        sessionUrl
      });

      await prisma.sentNotification.create({
        data: {
          userId: student.id,
          sessionId: session.id,
          type: type,
          status: success ? 'sent' : 'failed',
          errorMessage: success ? null : 'Email sending failed'
        }
      });
    } catch (error: any) {
      console.error(`Failed to send ${type} to ${student.email}:`, error);
    }
  }

  // Send SMS
  if (prefs.smsReminders && (timeUntil === '24h' ? prefs.sms24hBefore : prefs.sms1hBefore) && prefs.phoneNumber) {
    try {
      const success = await sendSessionReminderSMS({
        phoneNumber: prefs.phoneNumber,
        teacherName: teacher.user.name || 'Teacher',
        sessionTitle: session.title,
        sessionTimeDisplay,
        timeUntil
      });

      await prisma.sentNotification.create({
        data: {
          userId: student.id,
          sessionId: session.id,
          type: smsType,
          status: success ? 'sent' : 'failed',
          errorMessage: success ? null : 'SMS sending failed'
        }
      });
    } catch (error: any) {
      console.error(`Failed to send ${smsType} to ${prefs.phoneNumber}:`, error);
    }
  }
}
