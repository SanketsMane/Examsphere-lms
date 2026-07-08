"use server";

import { sendEmail } from "@/lib/email";
import { getSiteSettings } from "@/app/data/settings/get-site-settings";

export interface QueryResult {
  success: boolean;
  message: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Handles the footer "Query Box" submission. Delivers the message by email to the site's
 * contact address (falls back to EMAIL_USER). Called from the footer contact form.
 */
export async function submitFooterQuery(_prev: QueryResult | null, formData: FormData): Promise<QueryResult> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }
  if (message.length > 4000) {
    return { success: false, message: "Message is too long." };
  }

  try {
    const settings = await getSiteSettings();
    const to =
      settings?.contactEmail?.trim() ||
      process.env.CONTACT_EMAIL?.trim() ||
      process.env.EMAIL_USER?.trim();

    if (!to) {
      return { success: false, message: "Contact inbox is not configured. Please try again later." };
    }

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;color:#0C1730">
        <h2 style="color:#0F2557">New website query — ExamSphere</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap;background:#F4F7FC;padding:12px 14px;border-radius:8px">${escapeHtml(message)}</p>
      </div>`;

    const ok = await sendEmail({
      to,
      subject: `New website query from ${name}`,
      html,
    });

    if (!ok) {
      return { success: false, message: "Couldn't send your message right now. Please email us directly." };
    }

    return { success: true, message: "Thanks! Your message has been sent. We'll get back to you soon." };
  } catch (err) {
    console.error("Footer query submit failed:", err);
    return { success: false, message: "Something went wrong. Please try again later." };
  }
}
