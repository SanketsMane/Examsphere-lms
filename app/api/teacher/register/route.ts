import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket

export const dynamic = "force-dynamic";

const teacherRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  bio: z.string().min(50, "Bio must be at least 50 characters"),
  expertiseAreas: z.array(z.string()).min(1, "At least one expertise area is required").max(5, "Maximum 5 expertise areas allowed"),
  languages: z.array(z.string()).optional().default([]),
  hourlyRate: z.string().transform(val => parseInt(val)).refine(val => val >= 100 && val <= 50000, `Hourly rate must be between ${formatPriceSimple(100, "India")}-${formatPriceSimple(50000, "India")}`),
  experience: z.string().transform(val => parseInt(val)).refine(val => val >= 0, "Experience must be 0 or more years"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input data
    const validatedData = teacherRegistrationSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    let userId = "";

    if (existingUser) {
      // If user exists, we will upgrade them
      userId = existingUser.id;
    } else {
      // Create user account via better-auth
      const user = await auth.api.signUpEmail({
        body: {
          email: validatedData.email,
          password: validatedData.password,
          name: validatedData.name,
        } as any,
        asResponse: false
      });

      if (!user) {
        return NextResponse.json(
          { error: "Failed to create user account" },
          { status: 500 }
        );
      }
      userId = user.user.id;
    }

    // Check if teacher profile already exists for this user to avoid duplicates
    const existingProfile = await prisma.teacherProfile.findUnique({
      where: { userId: userId }
    });

    if (!existingProfile) {
      // Create teacher profile
      await prisma.teacherProfile.create({
        data: {
          userId: userId,
          bio: validatedData.bio,
          expertise: validatedData.expertiseAreas,
          languages: validatedData.languages,
          hourlyRate: validatedData.hourlyRate * 100, // Convert to cents
          isVerified: false, // Requires admin approval
          isApproved: false, // Requires admin approval
          timezone: "UTC", // Default, can be updated later
        }
      });
    }

    // Set role to teacher ONLY if user is currently a student or has no role
    // This prevents Admins from accidentally downgrading themselves during testing
    if (!existingUser || (existingUser.role !== 'admin' && existingUser.role !== 'teacher')) {
        await prisma.user.update({
          where: { id: userId },
          data: { role: 'teacher' }
        });
    }

    // Send welcome email with verification instructions
    await sendEmail({
      to: validatedData.email,
      subject: "Welcome to KIDOKOOL - Teacher Application Received",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px; margin-bottom: 30px;">
            <h1>🎓 Welcome to KIDOKOOL!</h1>
            <p style="margin: 0; font-size: 18px;">Your teacher application has been received</p>
          </div>
          
          <div style="padding: 20px;">
            <p>Hi ${validatedData.name},</p>
            
            <p>Thank you for applying to become a teacher on KIDOKOOL! We're excited about your interest in sharing knowledge with our students worldwide.</p>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #065f46; margin-top: 0;">Application Details:</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${validatedData.name}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${validatedData.email}</p>
              <p style="margin: 5px 0;"><strong>Expertise:</strong> ${validatedData.expertiseAreas.join(", ")}</p>
              <p style="margin: 5px 0;"><strong>Hourly Rate:</strong> ${formatPriceSimple(validatedData.hourlyRate, "India")}/hour</p>
              <p style="margin: 5px 0;"><strong>Experience:</strong> ${validatedData.experience} years</p>
            </div>
            
            <h3 style="color: #374151;">What's Next?</h3>
            <ol style="color: #6b7280; line-height: 1.6;">
              <li><strong>Review Process:</strong> Our team will review your application within 24-48 hours</li>
              <li><strong>Profile Verification:</strong> We may request additional documents or information</li>
              <li><strong>Account Activation:</strong> Once approved, you'll receive login credentials</li>
              <li><strong>Platform Training:</strong> Access to teacher resources and platform tutorials</li>
              <li><strong>Start Teaching:</strong> Begin creating courses and accepting students</li>
            </ol>
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h4 style="color: #1e40af; margin-top: 0;">💡 While You Wait:</h4>
              <ul style="color: #374151; margin-bottom: 0;">
                <li>Prepare your course materials and lesson plans</li>
                <li>Think about your teaching methodology and approach</li>
                <li>Consider your availability and schedule preferences</li>
                <li>Review our <a href="#" style="color: #3b82f6;">Teacher Guidelines</a></li>
              </ul>
            </div>
            
            <p>If you have any questions or concerns, please don't hesitate to reach out to our support team.</p>
            
            <p>Best regards,<br>The KIDOKOOL Team</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
            <p>This email was sent to ${validatedData.email}</p>
            <p>If you didn't apply to become a teacher, please ignore this email.</p>
          </div>
        </div>
      `,
    });

    // Send notification to admin about new teacher application
    const adminUsers = await prisma.user.findMany({
      where: { role: "admin" }
    });

    for (const admin of adminUsers) {
      // Create database notification for admin
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: "New Teacher Application",
          message: `${validatedData.name} has applied to become a teacher.`,
          type: "System",
          data: {
            teacherName: validatedData.name,
            teacherEmail: validatedData.email,
            profileId: userId // Using user ID as a reference
          }
        }
      });

      await sendEmail({
        to: admin.email,
        subject: "New Teacher Application - KIDOKOOL",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>🆕 New Teacher Application</h2>
            <p>A new teacher has applied to join KIDOKOOL:</p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Name:</strong> ${validatedData.name}</p>
              <p><strong>Email:</strong> ${validatedData.email}</p>
              <p><strong>Expertise:</strong> ${validatedData.expertiseAreas.join(", ")}</p>
              <p><strong>Hourly Rate:</strong> ${formatPriceSimple(validatedData.hourlyRate, "India")}/hour</p>
              <p><strong>Experience:</strong> ${validatedData.experience} years</p>
              <p><strong>Bio:</strong> ${validatedData.bio.substring(0, 200)}...</p>
            </div>
            
            <p>Please review the application in the admin panel and approve or reject as appropriate.</p>
            
            <a href="${process.env.BETTER_AUTH_URL || 'http://localhost:3001'}/admin/team" 
               style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Review Application
            </a>
          </div>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Teacher application submitted successfully",
      userId: userId,
    }, { status: 201 });

  } catch (error) {
    console.error("Teacher registration error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid form data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}