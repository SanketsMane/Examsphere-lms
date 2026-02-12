import nodemailer from 'nodemailer';
import { prisma } from './db';

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
function replacePlaceholders(content: string, data: TemplateData): string {
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

    const transporter = await getEmailProvider();

    if (!transporter) {
      // Fallback to env if no DB provider exists (for migration period or emergency)
      if (!process.env.EMAIL_HOST && !process.env.EMAIL_USER) {
        console.log('---------------------------------------------------');
        console.log('EMAIL SENT (MOCKED - No DB Provider and No ENV):');
        console.log('To:', emailData.to);
        console.log('Subject:', emailData.subject);
        console.log('---------------------------------------------------');
        return true;
      }

      // Existing env fallback logic
      const envTransporter = nodemailer.createTransport({
        host: (process.env.EMAIL_HOST || '').trim(),
        port: parseInt((process.env.EMAIL_PORT || '587').trim()),
        secure: (process.env.EMAIL_SECURE || 'false').trim() === 'true',
        auth: {
          user: (process.env.EMAIL_USER || '').trim(),
          pass: (process.env.EMAIL_PASS || '').trim()
        }
      });

      const mailOptions = {
        from: emailData.from || (process.env.EMAIL_FROM || '').trim() || (process.env.EMAIL_USER || '').trim(),
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html
      };

      await envTransporter.sendMail(mailOptions);
      return true;
    }

    const mailOptions = {
      from: emailData.from || (process.env.EMAIL_FROM || '').trim() || (process.env.EMAIL_USER || '').trim(),
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully via DB provider:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
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

    return await sendEmail({
      to,
      subject,
      html
    });
  } catch (error) {
    console.error(`Error sending templated email (${templateSlug}):`, error);
    return false;
  }
}