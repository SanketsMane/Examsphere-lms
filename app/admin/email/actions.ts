"use server";

import { sendEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/action-security"; // Assuming this exists, based on context
import { z } from "zod";

const testEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function sendTestEmail(formData: FormData) {
  try {
    // 1. Verify permissions
    await requireAdmin();

    // 2. Validate input
    const email = formData.get("email") as string;
    const result = testEmailSchema.safeParse({ email });

    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    // 3. Send email using existing utility
    const sent = await sendEmail({
      to: email,
      subject: "Test Email from Kidokool LMS",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email Successful! 🎉</h2>
          <p>This email confirms that your email configuration is working correctly.</p>
          <p><strong>Recipient:</strong> ${email}</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          <hr />
          <p style="font-size: 12px; color: #666;">Kidokool LMS Diagnostic Tool</p>
        </div>
      `,
    });

    if (sent) {
      return { success: "Test email sent successfully! Check your inbox." };
    } else {
      return { error: "Failed to send email. Check server logs." };
    }
  } catch (error) {
    console.error("Test email error:", error);
    return { error: "An unexpected error occurred." };
  }
}
