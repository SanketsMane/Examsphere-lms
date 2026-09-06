"use server";

import { sendEmail } from "@/lib/email";
import { getSiteSettings } from "@/app/data/settings/get-site-settings";

export interface ContactResult {
  success: boolean;
  message: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Contact page form. Delivers the enquiry by email to the site's configured contact
 * address (Site Settings → contactEmail, else CONTACT_EMAIL, else EMAIL_USER).
 *
 * Richer than the footer query box: it also captures phone and programme of interest,
 * which is what the admissions team actually needs to respond usefully.
 */
export async function submitContact(
  _prev: ContactResult | null,
  formData: FormData
): Promise<ContactResult> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const program = String(formData.get("program") || "").trim();
  const message = String(formData.get("message") || "").trim();
  // Honeypot — real users leave this empty.
  const website = String(formData.get("website") || "").trim();

  if (website) {
    // Bot: pretend success, do nothing.
    return { success: true, message: "Thanks! We'll get back to you soon." };
  }

  if (!name || !email || !message) {
    return { success: false, message: "Please fill in your name, email and message." };
  }
  if (!EMAIL_RE.test(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }
  if (phone && !/^[+\d][\d\s\-()]{6,19}$/.test(phone)) {
    return { success: false, message: "Please enter a valid phone number." };
  }
  if (name.length > 120 || message.length > 4000) {
    return { success: false, message: "That message is too long. Please shorten it." };
  }

  try {
    const settings = await getSiteSettings();
    const to =
      settings?.contactEmail?.trim() ||
      process.env.CONTACT_EMAIL?.trim() ||
      process.env.EMAIL_USER?.trim();

    if (!to) {
      return {
        success: false,
        message: "Our contact inbox isn't configured yet. Please email us directly.",
      };
    }

    const row = (label: string, value: string) =>
      `<p style="margin:0 0 8px"><strong style="color:#0F2557">${label}:</strong> ${escapeHtml(value)}</p>`;

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;color:#0C1730;line-height:1.6">
        <h2 style="color:#0F2557;margin:0 0 16px">New contact enquiry — ExamSphere</h2>
        ${row("Name", name)}
        ${row("Email", email)}
        ${phone ? row("Phone", phone) : ""}
        ${program ? row("Program of interest", program) : ""}
        <p style="margin:16px 0 8px"><strong style="color:#0F2557">Message:</strong></p>
        <p style="white-space:pre-wrap;background:#F4F7FC;padding:12px 14px;border-radius:8px;margin:0">${escapeHtml(
          message
        )}</p>
      </div>`;

    const ok = await sendEmail({
      to,
      subject: `Contact enquiry from ${name}${program ? ` — ${program}` : ""}`,
      html,
    });

    if (!ok) {
      return {
        success: false,
        message: "Couldn't send your message right now. Please email us directly.",
      };
    }

    return {
      success: true,
      message: "Thanks! Your enquiry has been sent — our team will get back to you shortly.",
    };
  } catch (err) {
    console.error("Contact submit failed:", err);
    return { success: false, message: "Something went wrong. Please try again later." };
  }
}
