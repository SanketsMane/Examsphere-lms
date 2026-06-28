import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { prisma } from './db';

const resendClient = () => new Resend(process.env.RESEND_API_KEY || '');

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
      logger: true,
      debug: true,
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
      logger: true,
      debug: true,
      auth: {
        user: (config.user || '').trim(),
        pass: (config.pass || '').trim()
      }
    });
  }
}

function getEnvTransporter() {
  // SMTP from environment (EMAIL_USER / EMAIL_PASS). Returns null if not configured.
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // false => STARTTLS on 587
    auth: { user, pass }
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
 * Send email using Resend (Primary) or SMTP (Fallback)
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

    const fromAddress =
      process.env.EMAIL_FROM ||
      `EXAMSPHERE <${process.env.EMAIL_USER || 'no-reply@examsphere.online'}>`;
    const mailOptions = {
      from: fromAddress,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    };

    // PRIMARY: RESEND HTTPS API (works where outbound SMTP is blocked, e.g. DigitalOcean)
    if (process.env.RESEND_API_KEY) {
      try {
        const data = await resendClient().emails.send({
          from: process.env.RESEND_FROM || fromAddress,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
        });
        if (data.data?.id) {
          console.log('Email sent successfully via RESEND!', data.data.id);
          return true;
        }
        console.warn('RESEND returned no ID, trying SMTP fallback...', data.error);
      } catch (resendError: any) {
        console.error('RESEND failed, trying SMTP fallback:', resendError?.message || resendError);
      }
    }

    // FALLBACK: ENV SMTP (EMAIL_USER / EMAIL_PASS) — used when SMTP egress is available
    const envTransporter = getEnvTransporter();
    if (envTransporter) {
      try {
        const info = await envTransporter.sendMail(mailOptions);
        console.log('Email sent successfully via ENV SMTP provider:', info.messageId);
        return true;
      } catch (envError: any) {
        console.error('ENV SMTP failed, trying DB provider:', envError?.message || envError);
      }
    }

    // FALLBACK: DATABASE-configured SMTP PROVIDER
    const dbTransporter = await getEmailProvider();
    if (dbTransporter) {
      try {
        const info = await dbTransporter.sendMail(mailOptions);
        console.log('Email sent successfully via DB SMTP provider:', info.messageId);
        return true;
      } catch (dbError: any) {
        console.error('DB SMTP provider failed:', dbError?.message || dbError);
      }
    }

    throw new Error('No valid email provider succeeded (RESEND, ENV SMTP, or DB)');
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
            errorMessage: success ? null : 'Failed to deliver email through SMTP/API',
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