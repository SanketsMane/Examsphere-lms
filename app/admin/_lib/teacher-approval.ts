import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendEmail, sendTemplatedEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

/**
 * Single source of truth for approving/rejecting a teacher.
 *
 * Admin → Teachers and the Verification Center used to call two different
 * implementations that each updated a different subset of state (one never
 * touched TeacherVerification, the other never sent a reason), so a teacher's
 * status depended on which screen the admin happened to use.
 */

/**
 * The review queue. Includes teachers with a profile but no verification record
 * yet: those were previously invisible to the Verification Center and could
 * only be found by scrolling Admin → Teachers.
 */
export const pendingTeacherWhere: Prisma.TeacherProfileWhereInput = {
  isApproved: false,
  user: { role: "teacher" },
  OR: [
    { verification: { is: null } },
    { verification: { is: { status: { in: ["Pending", "UnderReview"] } } } },
  ],
};

export type TeacherDecision =
  | { decision: "approve" }
  | { decision: "reject"; reason: string };

export type TeacherDecisionResult = {
  success: boolean;
  message: string;
};

type TeacherRef = { userId: string } | { profileId: string };

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "").replace(/\/$/, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Prefer the admin-editable DB template; fall back to a plain built-in email
 * when it hasn't been created yet, so the teacher is never left uninformed.
 */
async function sendDecisionEmail(
  to: string,
  slug: string,
  subject: string,
  data: Record<string, string>,
  fallbackBody: string
): Promise<boolean> {
  const template = await prisma.emailTemplate.findUnique({
    where: { slug },
    select: { isActive: true },
  });

  if (template?.isActive) {
    return sendTemplatedEmail(slug, to, subject, data);
  }

  return sendEmail({
    to,
    subject,
    html: `<p>Hi ${escapeHtml(data.userName)},</p>${fallbackBody}<p>— Team ExamSphere</p>`,
  });
}

export async function decideTeacher(
  ref: TeacherRef,
  input: TeacherDecision,
  adminId: string
): Promise<TeacherDecisionResult> {
  const approve = input.decision === "approve";
  const reason = input.decision === "reject" ? input.reason.trim() : null;

  if (!approve && !reason) {
    return { success: false, message: "Please provide a reason for rejection" };
  }

  let userId: string;
  if ("userId" in ref) {
    userId = ref.userId;
  } else {
    const profile = await prisma.teacherProfile.findUnique({
      where: { id: ref.profileId },
      select: { userId: true },
    });
    if (!profile) return { success: false, message: "Teacher profile not found" };
    userId = profile.userId;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) return { success: false, message: "User not found" };

  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      // Upsert handles imported users who were given the teacher role without a profile.
      const profile = await tx.teacherProfile.upsert({
        where: { userId },
        create: {
          userId,
          isApproved: approve,
          isVerified: approve,
          expertise: [],
          languages: [],
          qualifications: [],
          certifications: [],
        },
        update: { isApproved: approve, isVerified: approve },
        select: { id: true },
      });

      const decisionFields = approve
        ? { status: "Approved" as const, approvedAt: now, rejectionReason: null }
        : { status: "Rejected" as const, rejectedAt: now, rejectionReason: reason };

      await tx.teacherVerification.upsert({
        where: { teacherId: profile.id },
        create: {
          teacherId: profile.id,
          qualificationDocuments: [],
          experienceDocuments: [],
          reviewedAt: now,
          reviewedById: adminId,
          ...decisionFields,
        },
        update: {
          reviewedAt: now,
          reviewedById: adminId,
          ...decisionFields,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: "System",
          title: approve ? "Profile Approved" : "Application Status Update",
          message: approve
            ? "Congratulations! Your teacher profile has been approved. You can now create courses and start teaching."
            : `Your teacher application was not approved. Reason: ${reason}. Please update your profile and re-submit.`,
        },
      });
    });
  } catch (error) {
    logger.error("Failed to record teacher decision", error as Error, userId);
    return {
      success: false,
      message: approve ? "Failed to approve teacher" : "Failed to reject teacher",
    };
  }

  revalidatePath("/admin/teachers");
  revalidatePath(`/admin/teachers/${userId}`);
  revalidatePath("/admin/verification");
  revalidatePath("/admin/verification/profiles");

  let emailSent = false;
  if (user.email) {
    const userName = user.name || "Teacher";
    try {
      emailSent = approve
        ? await sendDecisionEmail(
            user.email,
            "teacherVerificationApproved",
            "Congratulations! Your Teacher Profile is Approved",
            { userName, dashboardUrl: `${appUrl()}/teacher` },
            `<p>Your teacher profile on ExamSphere has been approved. You can now create courses and start teaching.</p><p><a href="${appUrl()}/teacher">Open your teacher dashboard</a></p>`
          )
        : await sendDecisionEmail(
            user.email,
            "teacherVerificationRejected",
            "Update regarding your Teacher Application",
            { userName, reason: reason ?? "" },
            `<p>Your teacher application on ExamSphere was not approved.</p><p><strong>Reason:</strong> ${escapeHtml(reason ?? "")}</p><p>Please update your profile and documents, then submit again.</p>`
          );
    } catch (error) {
      logger.error("Failed to send teacher decision email", error as Error, userId);
    }
  }

  const action = approve ? "Teacher approved" : "Teacher application rejected";
  return {
    success: true,
    message: emailSent ? `${action} & email sent` : `${action} (email could not be sent)`,
  };
}
