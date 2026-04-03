import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { prisma } from './db';

const resend = new Resend(process.env.RESEND_API_KEY || 're_5EgNBQNR_JuMgLBiodC7fYQh7vfitV6TT');

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
  // HARDCODED GMAIL FOR BACKUP ONLY (EXPECTED TO FAIL ON SOME VPS)
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    logger: true,
    debug: true,
    auth: {
      user: 'bksun170882@gmail.com',
      pass: 'mwtinpysoylfarwj'
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

    // PRIMARY: RESEND (Robust API Delivery)
    if (process.env.RESEND_API_KEY) {
      try {
        console.log('Attempting to send email via RESEND...');
        const data = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
        });

        if (data.data?.id) {
          console.log('Email sent successfully via RESEND!', data.data.id);
          return true;
        }
        
        console.warn('RESEND API returned no ID, falling back to SMTP...', data.error);
      } catch (resendError: any) {
        console.error('RESEND API failed, trying SMTP fallback:', resendError?.message || resendError);
      }
    }

    // FALLBACK: DATABASE SMTP PROVIDER
    const dbTransporter = await getEmailProvider();
    if (dbTransporter) {
      try {
        const mailOptions = {
          from: '"KIDOKOOL" <bksun170882@gmail.com>',
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html
        };
        const info = await dbTransporter.sendMail(mailOptions);
        console.log('Email sent successfully via DB SMTP provider:', info.messageId);
        return true;
      } catch (dbError: any) {
        console.error('DB SMTP provider failed, trying ENV fallback:', dbError?.message || dbError);
      }
    }

    // FINAL FALLBACK: ENV GMAIL (Most likely to fail)
    const envTransporter = getEnvTransporter();
    if (envTransporter) {
      const mailOptions = {
        from: '"KIDOKOOL" <bksun170882@gmail.com>',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html
      };
      const info = await envTransporter.sendMail(mailOptions);
      console.log('Email sent successfully via ENV SMTP provider:', info.messageId);
      return true;
    }

    throw new Error('No valid email provider found (RESEND, DB or ENV)');
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