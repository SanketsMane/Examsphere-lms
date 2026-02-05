import { prisma } from "./db";

/**
 * Finance Logic Utility
 * Centralizes commission and fee calculations for the platform.
 * Author: Sanket
 */

/**
 * Calculates platform fee, GST, and teacher net amount based on dynamic settings.
 * @param amountInPaisa total amount in paisa (Razorpay paisa)
 * @author Sanket
 * @returns Object containing platform fee, net amount for teacher, and GST details
 */
export async function calculatePlatformCommission(amountInPaisa: number, teacherId?: string) {
  const settings = await prisma.siteSettings.findFirst();
  let commissionRate = (settings?.commissionPercentage || 20.0) / 100;
  
  // If teacherId provided, check for subscription override
  if (teacherId) {
      // Find teacher user ID first (teacherId is usually TeacherProfile.id, need to be sure)
      // Actually, UserSubscription is linked to User.
      // If passing TeacherProfile ID, I need to fetch userId.
      // Let's assume input matches what we have.
      // In webhook we have TeacherProfile.id usually or User.id.
      
      // Let's try to find subscription by TeacherProfile ID (via relation) or UserId.
      // Easiest is to lookup TeacherProfile to get UserId, then UserSubscription.
      
      const teacher = await prisma.teacherProfile.findUnique({
          where: { id: teacherId },
          select: { userId: true }
      });
      
      if (teacher) {
          const sub = await prisma.userSubscription.findUnique({
              where: { userId: teacher.userId },
              include: { plan: true }
          });
          
          if (sub && sub.status === 'active' && (sub.plan as any).metadata) {
              const meta = (sub.plan as any).metadata;
              if (typeof meta.commissionRate === 'number') {
                  commissionRate = meta.commissionRate / 100;
              }
          }
      }
  }

  const gstRate = (settings?.gstPercentage || 0.0) / 100;

  // Logic: Amount is INCLUSIVE of GST.
  // Base = Total / (1 + GST)
  // GST = Total - Base
  // Commission = Base * CommissionRate
  // Teacher Net = Base - Commission
  
  const total = amountInPaisa;
  const baseAmount = Math.round(total / (1 + gstRate));
  const gstAmount = total - baseAmount;
  
  const platformFee = Math.round(baseAmount * commissionRate);
  const teacherNet = baseAmount - platformFee;

  return {
    total,
    baseAmount,
    gstAmount,
    platformFee,
    teacherNet,
    currencyCode: settings?.currencyCode || "INR",
    currencySymbol: settings?.currencySymbol || "₹",
    // Decimal versions for display
    totalDecimal: total / 100,
    baseDecimal: baseAmount / 100,
    gstDecimal: gstAmount / 100,
    platformFeeDecimal: platformFee / 100,
    teacherNetDecimal: teacherNet / 100
  };
}
