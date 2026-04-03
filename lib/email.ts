import nodemailer from 'nodemailer';
import { prisma } from './db';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface TemplateData {
  [key: string]: string | number | undefined;
  userId?: string; // Added for tracking - Author: Sanket
  sessionId?: string; // Added for tracking - Author: Sanket
  notificationType?: string; // Added for tracking - Author: Sanket
}

/**
 * Author: Sanket
 * Fetches the active email provider configuration from the database
 */
async function getEmailProvider() {
  const provider = await prisma.emailProvider.findFirst({
    where: { isActive: true },
    orderBy: { isDefault: 'desc' }
  });

  if (!provider) return null;

  const config = provider.config as any;

  if (provider.type === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: (config.user || '').trim(),
        pass: (config.pass || '').trim()
      }
    });
  } else {
    return nodemailer.createTransport({
      host: (config.host || '').trim(),
      port: config.port,
      secure: config.secure,
      auth: {
        user: (config.user || '').trim(),
        pass: (config.pass || '').trim()
      }
    });
  }
}

function getEnvTransporter() {
  if (!process.env.EMAIL_USER) {
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: (process.env.EMAIL_PASS || '').trim()
    }
  });
}

/**
 * Author: Sanket
 * Checks if the email system is globally enabled
 */
async function isEmailSystemEnabled() {
  const settings = await prisma.emailGlobalSettings.findUnique({
    where: { id: 'default' }
  });
  return settings?.isSystemEnabled ?? true;
}

/**
 * Author: Sanket
 * Replaces placeholders in format ${placeholder} with data
 */
export function replacePlaceholders(content: string, data: TemplateData): string {
  return content.replace(/\${(\w+)}/g, (match, key) => {
    return data[key]?.toString() ?? match;
  });
}

/**
 * Send email using the configured transporter from DB
 * Author: Sanket
 */
export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // Check if system is enabled
    const enabled = await isEmailSystemEnabled();
    if (!enabled) {
      console.log('Email system is globally disabled. Skipping email to:', emailData.to);
      return true;
    }

    const mailOptions = {
      from: emailData.from || (process.env.EMAIL_FROM || '').trim() || (process.env.EMAIL_USER || '').trim(),
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html
    };

    const dbTransporter = await getEmailProvider();

    if (dbTransporter) {
      try {
        const info = await dbTransporter.sendMail(mailOptions);
        console.log('Email sent successfully via DB provider:', info.messageId);
        return true;
      } catch (dbError: any) {
        console.error('DB provider failed, trying env fallback:', dbError?.message || dbError);
      }
    }

    const envTransporter = getEnvTransporter();
    if (envTransporter) {
      const info = await envTransporter.sendMail(mailOptions);
      console.log('Email sent successfully via ENV provider:', info.messageId);
      return true;
    }

    throw new Error('No valid email provider found (DB or ENV)');
  } catch (error: any) {
    console.error('Error sending email:', error);
    throw error; // Propagate the error to Better Auth
  }
}

/**
 * Send templated email fetching from DB
 * Author: Sanket
 */
export async function sendTemplatedEmail(
  templateSlug: string,
  to: string,
  defaultSubject: string,
  data: TemplateData
): Promise<boolean> {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { slug: templateSlug }
    });

    if (!template || !template.isActive) {
      console.warn(`Email template "${templateSlug}" not found or inactive in DB. Email not sent.`);
      return false;
    }

    const html = replacePlaceholders(template.content, data);
    const subject = replacePlaceholders(template.subject, data) || defaultSubject;

    const success = await sendEmail({
      to,
      subject,
      html
    });

    // QA-006: Log notification status for reliability/auditing - Author: Sanket
    if (data.userId && data.sessionId) {
      try {
        await prisma.sentNotification.create({
          data: {
            userId: data.userId as string,
            sessionId: data.sessionId as string,
            type: data.notificationType as string || templateSlug,
            status: success ? 'sent' : 'failed',
            errorMessage: success ? null : 'Failed to deliver email through SMTP',
          }
        });
      } catch (logError) {
        console.error('CRITICAL: Failed to log notification status:', logError);
      }
    }

    return success;
  } catch (error: any) {
    console.error(`Error sending templated email (${templateSlug}):`, error);
    return false;
  }
}