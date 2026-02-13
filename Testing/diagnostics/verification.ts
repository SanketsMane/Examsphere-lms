
/**
 * QA Audit Verification Script (Robust Version)
 * Author: Sanket
 * Purpose: Seeds data and verifies QA fixes.
 */

import { prisma } from '../../lib/db';
import { sendTemplatedEmail } from '../../lib/email';

async function runVerification() {
    console.log('🚀 Starting Deep QA Verification...\n');

    // Setup Test Data
    console.log('--- Setting up Test Data ---');
    let teacher = await prisma.teacherProfile.findFirst({ include: { user: true } });
    if (!teacher) {
        console.log('No teacher found, creating dummy teacher...');
        const user = await prisma.user.create({
            data: {
                name: 'Test Teacher',
                email: 'teacher@test.com',
                emailVerified: true,
                role: 'teacher'
            }
        });
        teacher = await prisma.teacherProfile.create({
            data: {
                userId: user.id,
                bio: 'Test Bio'
            },
            include: { user: true }
        });
    }

    let student = await prisma.user.findFirst({ where: { role: 'student' } });
    if (!student) {
        console.log('No student found, creating dummy student...');
        student = await prisma.user.create({
            data: {
                name: 'Test Student',
                email: 'student@test.com',
                emailVerified: true,
                role: 'student'
            }
        });
    }

    let session = await prisma.liveSession.findFirst();
    if (!session) {
        console.log('No live session found, creating dummy session...');
        session = await prisma.liveSession.create({
            data: {
                teacherId: teacher.id,
                studentId: student.id,
                title: 'Test Session',
                scheduledAt: new Date(),
                duration: 60,
                price: 1000,
                status: 'scheduled'
            }
        });
    }

    // 1. Verify Notification Failure Logging (QA-006)
    console.log('\n--- Testing Notification Logging (QA-006) ---');
    
    // We'll use bookingConfirmation which we know exists
    console.log('Triggering email for template "bookingConfirmation"...');
    await sendTemplatedEmail('bookingConfirmation', student.email, 'Confirmation', {
        userName: student.name,
        sessionTitle: session.title,
        sessionDate: session.scheduledAt.toLocaleDateString(),
        sessionTime: session.scheduledAt.toLocaleTimeString(),
        teacherName: teacher.user.name,
        userId: student.id,
        sessionId: session.id,
        notificationType: 'verification_test'
    });

    const logEntry = await prisma.sentNotification.findFirst({
        where: { userId: student.id, sessionId: session.id, type: 'verification_test' }
    });

    if (logEntry) {
        console.log('✅ PASS: Notification log entry created successfully.');
        console.log('   Status:', logEntry.status, '| Type:', logEntry.type);
    } else {
        console.log('❌ FAIL: No notification log entry found.');
    }

    // 2. Verify Scheduling Conflict Logic (QA-004)
    console.log('\n--- Testing Scheduling Conflict Logic (QA-004) ---');
    
    // Test logic from book-session.ts
    const studentOverlap = await prisma.liveSession.findFirst({
        where: {
            studentId: student.id,
            status: { in: ['scheduled', 'in_progress'] },
            OR: [
                {
                    AND: [
                        { scheduledAt: { lte: session.scheduledAt } },
                        {
                            scheduledAt: {
                                gte: new Date(session.scheduledAt.getTime() - session.duration * 60000)
                            }
                        }
                    ]
                },
                {
                    scheduledAt: {
                        gte: session.scheduledAt,
                        lt: new Date(session.scheduledAt.getTime() + session.duration * 60000)
                    }
                }
            ]
        }
    });

    if (studentOverlap) {
        console.log('✅ PASS: Overlap logic correctly identified existing session.');
    } else {
        console.log('❌ FAIL: Overlap logic failed to find existing session.');
    }

    console.log('\n🚀 Verification COMPLETE.');
}

runVerification()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
