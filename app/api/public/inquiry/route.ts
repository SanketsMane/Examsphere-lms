import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

/**
 * Public inquiry endpoint — creates a lead BEFORE the visitor is allowed to chat.
 * Captures name / email / phone (+ IP & user-agent for context) and notifies the
 * admin inbox best-effort. Returns { inquiryId } which the chatbot then attaches to
 * every message so the whole conversation is stored against this lead.
 */

export const dynamic = "force-dynamic";

// --- small in-memory IP rate limiter (per server instance) ---
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_PER_WINDOW;
}

const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isPhone = (p: string) => {
  const digits = p.replace(/[^\d]/g, "");
  return digits.length >= 7 && digits.length <= 15;
};
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function notifyAdmin(inquiry: { name: string; email: string; phone: string; id: string }) {
  const to = process.env.CONTACT_EMAIL?.trim() || process.env.EMAIL_USER?.trim();
  if (!to) return;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;color:#0C1730">
      <h2 style="color:#0F2557;margin:0 0 12px">New chatbot inquiry — ExamSphere</h2>
      <p style="margin:4px 0"><strong>Name:</strong> ${esc(inquiry.name)}</p>
      <p style="margin:4px 0"><strong>Email:</strong> ${esc(inquiry.email)}</p>
      <p style="margin:4px 0"><strong>Phone:</strong> ${esc(inquiry.phone)}</p>
      <p style="margin:16px 0 0;font-size:13px;color:#5B6b86">
        View the full conversation in the admin panel → Inquiries.
      </p>
    </div>`;
  await sendEmail({ to, subject: `New chatbot inquiry from ${inquiry.name}`, html });
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      website?: string; // honeypot
    };

    // Honeypot — real users never fill this. Pretend success, store nothing.
    if (String(body.website || "").trim()) {
      return NextResponse.json({ inquiryId: "ok" });
    }

    const name = String(body.name || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().slice(0, 200).toLowerCase();
    const phone = String(body.phone || "").trim().slice(0, 40);

    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Please provide your name, email and mobile number." }, { status: 400 });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!isPhone(phone)) {
      return NextResponse.json({ error: "Please enter a valid mobile number." }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent")?.slice(0, 500) || null;

    const inquiry = await prisma.chatInquiry.create({
      data: { name, email, phone, ipAddress: ip, userAgent },
      select: { id: true, name: true, email: true, phone: true },
    });

    // Fire-and-forget admin notification — never blocks the visitor.
    notifyAdmin(inquiry).catch((e) => console.error("Inquiry admin notify failed:", e?.message || e));

    return NextResponse.json({ inquiryId: inquiry.id });
  } catch (err) {
    console.error("Create inquiry failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
