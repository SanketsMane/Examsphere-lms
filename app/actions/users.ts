"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

async function requireAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user?.role !== "admin") throw new Error("Unauthorized");
    return user;
}

export async function createUser(prevState: any, formData: FormData) {
    try {
        await requireAdmin();

        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const role = formData.get("role") as string;

        if (!name || !email || !password || !role) {
            return { error: "All fields are required" };
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return { error: "User with this email already exists" };
        }

        const hashedPassword = await hash(password, 10);

        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    role: role as any,
                    emailVerified: true, // Auto-verify manually created users
                },
            });

            await tx.account.create({
                data: {
                    userId: user.id,
                    accountId: user.id,
                    providerId: "credential",
                    password: hashedPassword,
                    // better-auth might expect these timestamps
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
        });

        revalidatePath("/admin/users");
        return { success: true, message: "User created successfully" };
    } catch (error: any) {
        console.error("Create User Error:", error);
        return { error: error.message };
    }
}

export async function bulkImportUsers(users: any[]) {
    try {
        await requireAdmin();

        let createdCount = 0;
        let updatedCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const user of users) {
            try {
                // Password is optional for updates, required for create
                if (!user.name || !user.email || !user.role) {
                    throw new Error(`Missing fields for ${user.email || 'unknown user'}: Name, Email, or Role`);
                }

                const existing = await prisma.user.findUnique({ where: { email: user.email } });
                
                // Only hash password if it exists
                const hashedPassword = user.password ? await hash(user.password, 10) : undefined;

                if (existing) {
                    // Update Logic
                    await prisma.$transaction(async (tx) => {
                        // Update User Details
                        await tx.user.update({
                            where: { id: existing.id },
                            data: {
                                name: user.name,
                                role: user.role.toLowerCase() as any,
                            }
                        });

                        // Update Password ONLY if provided and account exists
                        if (hashedPassword) {
                            const account = await tx.account.findFirst({
                                where: { userId: existing.id, providerId: "credential" }
                            });

                            if (account) {
                                await tx.account.update({
                                    where: { id: account.id },
                                    data: {
                                        password: hashedPassword,
                                        updatedAt: new Date()
                                    }
                                });
                            }
                        }
                    });
                    updatedCount++;
                } else {
                    // Create Logic - Password is REQUIRED for new users
                    if (!hashedPassword) {
                         throw new Error(`New user ${user.email} requires a password.`);
                    }

                    await prisma.$transaction(async (tx) => {
                        const newUser = await tx.user.create({
                            data: {
                                name: user.name,
                                email: user.email,
                                role: user.role.toLowerCase(),
                                emailVerified: true
                            }
                        });

                        await tx.account.create({
                            data: {
                                userId: newUser.id,
                                accountId: newUser.id,
                                providerId: "credential",
                                password: hashedPassword,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            }
                        });
                    });
                    createdCount++;
                }
            } catch (err: any) {
                errorCount++;
                errors.push(err.message);
            }
        }

        revalidatePath("/admin/users");
        return {
            success: true,
            message: `Processed: ${createdCount} created, ${updatedCount} updated. ${errorCount} failed.`,
            details: errors
        };
    } catch (error: any) {
        return { error: error.message };
    }
}
export async function getUsersForExport() {
    try {
        await requireAdmin();

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                emailVerified: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return { success: true, users };
    } catch (error: any) {
        return { error: error.message };
    }
}
