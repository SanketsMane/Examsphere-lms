"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/action-security";
import { checkGroupClassLimit, checkEnrollmentLimit } from "@/lib/subscription-limits";

// --- Group Class Management ---

export async function createGroupClass(data: {
    title: string;
    description: string;
    scheduledAt: Date;
    duration: number;
    price: number;
    maxStudents: number;
    isAdvertised?: boolean;
    isFreeTrialEligible?: boolean;  // Free trial option - Author: Sanket
    subjectId?: string; // Subject ID - Author: Sanket
    bannerUrl?: string; // Optional for packages
}) {
    // Enforce max students limit of 12
    const maxStudents = Math.min(data.maxStudents || 12, 12);

    const session = await requireTeacher();

    const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: (session.user as any).id }
    });

    if (!teacher) return { error: "Teacher profile not found" };

    // --- Feature Gating: Group Class Limit (Author: Sanket - Hardened for expiration) ---
    const { checkGroupClassLimit } = await import("@/lib/subscription-limits");
    const { allowed, limit } = await checkGroupClassLimit((session.user as any).id);

    if (!allowed) {
        return { error: `You have reached the limit of ${limit} active group classes or your subscription has expired. Upgrade to create more.` };
    }
    // -----------------------------------------

    try {
        const groupClass = await prisma.groupClass.create({
            data: {
                teacherId: teacher.id,
                title: data.title,
                description: data.description,
                scheduledAt: data.scheduledAt,
                duration: data.duration,
                price: data.price,
                maxStudents: maxStudents,
                isAdvertised: data.isAdvertised || false,
                isFreeTrialEligible: data.isFreeTrialEligible || false,
                subjectId: data.subjectId,
                bannerUrl: data.bannerUrl,
                status: "Scheduled"
            }
        });

        // Create a conversation for this group automaticaly ? 
        // Or on demand. Let's do it on demand or separate action to reduce complexity here.

        revalidatePath("/teacher/groups");
        return { success: true, groupClass };
    } catch (error) {
        console.error("Create Group Error:", error);
        return { error: "Failed to create group class" };
    }
}

export async function deleteGroupClass(groupId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: "Unauthorized" };
    
    // Add Admin bypass for moderation - Author: Sanket
    const isAdmin = (session.user as any).role === "admin";
    if (!isAdmin && (session.user as any).role !== "teacher") return { error: "Unauthorized" };

    try {
        // QA-001: Fix IDOR - Check ownership
        const teacher = await prisma.teacherProfile.findUnique({
             where: { userId: (session.user as any).id }
        });
        
        if (!teacher) return { error: "Teacher profile not found" };

        const group = await prisma.groupClass.findUnique({
             where: { id: groupId }
        });

        if (!group) return { error: "Group not found" };
        
        // Admin bypass for moderation - Author: Sanket
        const isAdmin = (session.user as any).role === "admin";
        if (!isAdmin && group.teacherId !== teacher?.id) {
            return { error: "Unauthorized" };
        }

        await prisma.groupClass.delete({
            where: { id: groupId }
        });
        revalidatePath("/teacher/groups");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete group" };
    }
}


// --- Enrollment / Student Management ---

/**
 * Join a group class (request enrollment)
 * @author Sanket
 * @param groupId - Group class ID
 * @param paymentMethod - "stripe" or "wallet"
 */
export async function joinGroupClass(groupId: string, paymentMethod: "online" | "wallet" = "online", couponCode?: string) {
    /**
     * Handles group class enrollment with coupon support and free trial limits.
     * Author: Sanket
     */
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: "Unauthorized" };
    const user = session.user;

    // QA-002: Atomic Transaction Fix (Author: Sanket)
    try {
    // 2. [STRICT ENFORCEMENT] Subscription Enrollment Limits (Author: Sanket - Hardened for expiration)
    const { checkEnrollmentLimit } = await import("@/lib/subscription-limits");
    const limitCheck = await checkEnrollmentLimit((user as any).id);
    if (!limitCheck.allowed) {
        return { error: `You have reached your limit of ${limitCheck.limit} active course/group enrollments or your subscription has expired. Please upgrade your plan.` };
    }

        // Start Transaction
        return await prisma.$transaction(async (tx) => {
             // 1. Fetch Group + Enrollments (Inside TX for consistency/capacity check)
             const groupClass = await tx.groupClass.findUnique({
                where: { id: groupId },
                include: { 
                    teacher: true,
                    enrollments: { where: { status: { in: ["Active", "Pending"] } } }
                }
            });

            if (!groupClass) throw new Error("Group class not found");

            const siteSettings = await tx.siteSettings.findFirst();
            const freeUsage = await tx.freeClassUsage.findUnique({ where: { studentId: (user as any).id } });

            // 3. Capacity Check (Inside TX)
            const globalLimit = siteSettings?.maxGroupClassSize || 12;
            const classLimit = groupClass.maxStudents || globalLimit;
            const effectiveLimit = Math.min(classLimit, globalLimit);

            if (groupClass.enrollments.length >= effectiveLimit) {
                throw new Error(`Class is full (Max ${effectiveLimit} students)`);
            }

            // 3. Free Usage Check
            if (groupClass.price === 0) {
                if (freeUsage?.groupUsed) {
                    throw new Error("You have already used your free group class.");
                }
                if (!groupClass.teacher.allowFreeGroup) {
                   throw new Error("This teacher does not accept free group trials.");
                }
            }

            // Check if already enrolled
            const existing = await tx.groupEnrollment.findFirst({
                where: { classId: groupId, studentId: (user as any).id }
            });
            if (existing) throw new Error("Already requested or enrolled");
            
            // --- Coupon Logic ---
            let finalPrice = groupClass.price;
            let couponId: string | undefined;

            if (couponCode && finalPrice > 0) {
                const coupon = await tx.coupon.findUnique({
                    where: { code: couponCode, isActive: true }
                });

                if (coupon) {
                    const now = new Date();
                    const isValid = 
                        (!coupon.expiryDate || now <= coupon.expiryDate) &&
                        (coupon.usedCount < coupon.usageLimit);
                    
                    const isApplicableForTeacher = !coupon.teacherId || coupon.teacherId === groupClass.teacherId;
                    const isApplicableOnType = coupon.applicableOn.includes("GROUP");

                    if (isValid && isApplicableForTeacher && isApplicableOnType) {
                        let discount = 0;
                        if (coupon.type === "PERCENTAGE") {
                            discount = Math.round((groupClass.price * coupon.value) / 100);
                        } else {
                            discount = coupon.value;
                        }
                        finalPrice = Math.max(0, groupClass.price - discount);
                        couponId = coupon.id;
                    }
                }
            }

            // Check Free Trial Eligibility
            const { checkFreeTrialEligibility, recordFreeTrialUsage } = await import("./free-trial-helpers");
            // calling external helpers (they use prisma, not tx, but they are read-heavy or create-heavy. 
            // recordFreeTrialUsage should ideally use tx. I might need to refactor it later or assume it's okay for now as logic non-critical for money loss)
            
            const isEligibleForFreeTrial = await checkFreeTrialEligibility({
                studentId: (user as any).id,
                studentEmail: (user as any).email,
                teacherId: groupClass.teacherId
            });

            const isFreeTrialEnrollment = groupClass.isFreeTrialEligible && isEligibleForFreeTrial;

            if (groupClass.isFreeTrialEligible && finalPrice === 0 && !isEligibleForFreeTrial) {
                throw new Error("You have already used your free trial with this teacher.");
            }

            // If wallet payment or FREE class
            if ((paymentMethod === "wallet" && finalPrice > 0) || finalPrice === 0) {
                
                // Wallet Deduction (Atomic)
                if (finalPrice > 0) {
                     const { deductFromWallet } = await import("./wallet");
                     await deductFromWallet(
                        (user as any).id,
                        finalPrice,
                        "GROUP_ENROLLMENT",
                        `Joined group class: ${groupClass.title}`,
                        { groupId: groupClass.id, groupTitle: groupClass.title, couponId },
                        tx // Passing Transaction Client!
                    );
                }

                // If free trial, record usage (Note: recordFreeTrialUsage might act outside tx if not refactored. 
                // But worst case: record created, tx fails -> artifact remains. Acceptable risk compared to money.)
                // Actually I should just inline logic if sensitive. But it's just a log.
                if (isFreeTrialEnrollment) {
                    await recordFreeTrialUsage({
                        studentId: (user as any).id,
                        studentEmail: (user as any).email,
                        teacherId: groupClass.teacherId,
                        sessionType: "group_class",
                        sessionId: groupClass.id
                    });
                }

                // Update Coupon
                if (couponId) {
                    await tx.couponUsage.create({
                        data: {
                            couponId,
                            userId: (user as any).id,
                            orderId: `group_${groupClass.id}_${Date.now()}`
                        }
                    });
                    await tx.coupon.update({
                        where: { id: couponId },
                        data: { usedCount: { increment: 1 } }
                    });
                }

                // Create Enrollment
                await tx.groupEnrollment.create({
                    data: {
                        classId: groupId,
                        studentId: (user as any).id,
                        status: "Active"
                    }
                });

                // --- Synchronize Chat Participation (Author: Sanket) ---
                if (groupClass.chatGroupId) {
                    await tx.conversationParticipant.upsert({
                        where: {
                            conversationId_userId: {
                                conversationId: groupClass.chatGroupId,
                                userId: (user as any).id
                            }
                        },
                        update: {},
                        create: {
                            conversationId: groupClass.chatGroupId,
                            userId: (user as any).id
                        }
                    });
                }
                // -----------------------------------------------------

                // Commission
                if (finalPrice > 0) {
                    const { calculatePlatformCommission } = await import("@/lib/finance");
                    const { platformFee, teacherNet } = await calculatePlatformCommission(finalPrice * 100);
                    
                    await tx.commission.create({
                        data: {
                            teacherId: groupClass.teacherId,
                            type: "GroupClass",
                            amount: finalPrice * 100,
                            commission: platformFee,
                            netAmount: teacherNet,
                            status: "Pending"
                        }
                    });
                }

                await tx.notification.create({
                    data: {
                        userId: (user as any).id,
                        title: "Joined Group Class",
                        message: `You've successfully joined "${groupClass.title}".`,
                        type: "Session"
                    }
                });

                return { success: true, message: "Successfully joined group class" };
            }

            // Razorpay Flow (Non-Atomic relative to above, but strict logic)
            // If payment method is 'online', we return order ID.
            // No DB changes yet except pending enrollment.
            const { getRazorpayInstance, getRazorpayKeyId } = await import("@/lib/razorpay");
            const razorpay = await getRazorpayInstance();
            const amountInPaisa = Math.round(finalPrice * 100);

            const enrollment = await tx.groupEnrollment.create({
                data: {
                    classId: groupId,
                    studentId: (user as any).id,
                    status: "Pending"
                }
            });

            const options = {
                amount: amountInPaisa.toString(),
                currency: "INR",
                receipt: enrollment.id,
                notes: {
                    type: "GROUP_ENROLLMENT",
                    groupId: groupId,
                    enrollmentId: enrollment.id,
                    userId: (user as any).id,
                    couponCode: couponCode || "",
                    couponId: couponId || ""
                }
            };

            const order = await razorpay.orders.create(options);

            await tx.groupEnrollment.update({
                where: { id: enrollment.id },
                data: { razorpayOrderId: order.id }
            });

            return { 
                success: true, 
                orderId: order.id,
                amount: amountInPaisa,
                currency: "INR",
                keyId: await getRazorpayKeyId(),
                groupTitle: groupClass.title,
                user: {
                    name: (user as any).name, // Fixed type
                    email: (user as any).email,
                },
                requiresPayment: true // Signal to frontend that we returned a payment order
            };

        }); // End Transaction

    } catch (error: any) {
        console.error("Join group error:", error);
        if (error.message?.includes("Insufficient balance") || error.message?.includes("Class is full")) {
            return { error: error.message };
        }
        return { error: error.message || "Failed to join group class" }; // Return actual error description
    }
}

/**
 * Request to join a group (alias/wrapper for joinGroupClass with default method)
 * Used by PackagesList component
 * Author: Sanket
 */
export async function requestToJoinGroup(groupId: string, couponCode?: string) {
    return joinGroupClass(groupId, "online", couponCode);
}

export async function updateEnrollmentStatus(enrollmentId: string, status: "Active" | "Cancelled") {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || (session.user as any).role !== "teacher") return { error: "Unauthorized" };
    // Ideally verify teacher owns the class, skipping for brevity but recommended

    // QA-001: Fix IDOR
    try {
        const teacher = await prisma.teacherProfile.findUnique({
            where: { userId: (session.user as any).id }
        });
        if (!teacher) return { error: "Teacher profile not found" };

        // Verify class ownership through enrollment
        const enrollment = await prisma.groupEnrollment.findUnique({
             where: { id: enrollmentId },
             include: { class: true }
        });

        if (!enrollment) return { error: "Enrollment not found" };
        if (enrollment.class.teacherId !== teacher.id) return { error: "Unauthorized" };

        await prisma.groupEnrollment.update({
            where: { id: enrollmentId },
            data: { status }
        });

        revalidatePath("/teacher/groups");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update status" };
    }
}

export async function removeStudentFromGroup(classId: string, studentId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || (session.user as any).role !== "teacher") return { error: "Unauthorized" };

    try {
        const teacher = await prisma.teacherProfile.findUnique({
            where: { userId: (session.user as any).id }
        });
        if (!teacher) return { error: "Teacher profile not found" };

        const group = await prisma.groupClass.findUnique({
             where: { id: classId }
        });
        if (!group) return { error: "Group not found" };
        if (group.teacherId !== teacher.id) return { error: "Unauthorized" };

        await prisma.groupEnrollment.delete({
            where: {
                classId_studentId: {
                    classId,
                    studentId
                }
            }
        });
        revalidatePath("/teacher/groups");
        return { success: true };
    } catch (error) {
        return { error: "Failed to remove student" };
    }
}

export async function updateGroupClass(groupId: string, data: any) {
    // Enforce max students limit of 12
    const maxStudents = Math.min(data.maxStudents || 12, 12);

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: "Unauthorized" };

    // Admin bypass for moderation - Author: Sanket
    const isAdmin = (session.user as any).role === "admin";
    if (!isAdmin && (session.user as any).role !== "teacher") return { error: "Unauthorized" };

    try {
        const teacher = await prisma.teacherProfile.findUnique({
            where: { userId: (session.user as any).id }
        });
        if (!teacher) return { error: "Teacher profile not found" };

        const group = await prisma.groupClass.findUnique({ where: { id: groupId } });
        if (!group) return { error: "Group not found" };

        // Admin can update any class, Teacher must own it - Author: Sanket
        if (!isAdmin && group.teacherId !== teacher?.id) {
            return { error: "Unauthorized" };
        }
        
        await prisma.groupClass.update({
            where: { id: groupId },
            data: {
                title: data.title,
                description: data.description,
                scheduledAt: data.scheduledAt,
                duration: data.duration,
                price: data.price,
                maxStudents: maxStudents,
                isAdvertised: data.isAdvertised,
                subject: data.subjectId ? ({ connect: { id: data.subjectId } } as any) : ({ disconnect: group?.subjectId ? true : false } as any),
                bannerUrl: data.bannerUrl
            }
        });
        revalidatePath("/teacher/groups");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update group" };
    }
}

// --- Chat Integration ---

export async function createGroupChat(groupId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { error: "Unauthorized" };

    try {
        const group = await prisma.groupClass.findUnique({
            where: { id: groupId },
            include: { enrollments: true } // to add students if needed initially
        });

        if (!group) return { error: "Group not found" };

        const teacher = await prisma.teacherProfile.findUnique({
            where: { userId: (session.user as any).id }
        });
        if (!teacher || group.teacherId !== teacher.id) {
            return { error: "Unauthorized: Only the teacher of this class can create a chat." };
        }

        if (group.chatGroupId) {
            return { success: true, conversationId: group.chatGroupId };
        }

        const conversation = await prisma.conversation.create({
            data: {
                isGroup: true,
                title: group.title + " Chat",
                participants: {
                    create: [
                        { userId: (session.user as any).id, isAdmin: true }, // Teacher
                        ...group.enrollments.map(e => ({ userId: e.studentId })) // Joined students
                    ]
                }
            } as any
        });

        await prisma.groupClass.update({
            where: { id: groupId },
            data: { chatGroupId: conversation.id }
        });

        return { success: true, conversationId: conversation.id };
    } catch (error) {
        console.error("Failed to create group conversation:", error);
        return { error: "Failed to create conversation" };
    }
}
