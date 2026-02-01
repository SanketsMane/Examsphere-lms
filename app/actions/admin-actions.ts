"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/action-security";

export async function deleteDummyData() {
    await requireAdmin();
    const dummyNames = [
        "Sarah Jenkins",
        "Sarah Wilson",
        "Mike Chen",
        "David Chen",
        "Emily Watson",
        "John Doe",
        "Jane Doe",
        "Instructor",
        "Teacher"
    ];

    let deletedCount = 0;

    try {
        console.log("Starting cleanup of dummy users via Admin Action...");

        for (const name of dummyNames) {
            const users = await prisma.user.findMany({
                where: {
                    name: {
                        contains: name,
                        mode: 'insensitive'
                    }
                }
            });

            for (const user of users) {
                // Delete related data first
                try { await prisma.teacherProfile.deleteMany({ where: { userId: user.id } }); } catch (e) { }
                try { await prisma.review.deleteMany({ where: { reviewerId: user.id } }); } catch (e) { }
                try { await prisma.blogPost.deleteMany({ where: { authorId: user.id } }); } catch (e) { }
                try { await prisma.account.deleteMany({ where: { userId: user.id } }); } catch (e) { }
                try { await prisma.session.deleteMany({ where: { userId: user.id } }); } catch (e) { }

                // Delete user
                await prisma.user.delete({ where: { id: user.id } });
                deletedCount++;
            }
        }

        // Clean Reviews
        try {
            await prisma.review.deleteMany({
                where: {
                    OR: [
                        { comment: { contains: "Sarah Jenkins" } },
                        { title: { contains: "Dummy" } }
                    ]
                }
            });
        } catch (e) {
            console.error("Failed to clean reviews", e);
        }

        revalidatePath("/");
        revalidatePath("/find-teacher");

        return { success: true, count: deletedCount, message: `Successfully deleted ${deletedCount} dummy users.` };
    } catch (error) {
        console.error("Cleanup failed:", error);
        return { success: false, message: "Failed to delete data. Check server logs." };
    }
}
