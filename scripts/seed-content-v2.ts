import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting production-ready seeding...");

    // 1. Create Users
    const password = await hash("password123", 10);

    const admin = await prisma.user.upsert({
        where: { email: "a" },
        update: {},
        create: {
            id: "admin-user",
            name: "Admin User",
            email: "admin@kidokool.com",
            role: "admin",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    const teacher = await prisma.user.upsert({
        where: { email: "teacher@kidokool.com" },
        update: {
            gender: "Female",
            country: "United Kingdom",
        },
        create: {
            id: "teacher-user",
            name: "Sarah Jenkins",
            email: "teacher@kidokool.com",
            image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
            role: "teacher",
            emailVerified: true,
            gender: "Female",
            country: "United Kingdom",
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    const teacher2 = await prisma.user.upsert({
        where: { email: "mike@kidokool.com" },
        update: {
            gender: "Male",
            country: "Singapore",
        },
        create: {
            id: "teacher-mike",
            name: "Mike Chen",
            email: "mike@kidokool.com",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
            role: "teacher",
            emailVerified: true,
            gender: "Male",
            country: "Singapore",
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    // 2. Create Teacher Profile
    const teacherProfile = await prisma.teacherProfile.upsert({
        where: { userId: teacher.id },
        create: {
            userId: teacher.id,
            bio: "Professional software instructor with 10+ years of experience in web development and design.",
            expertise: ["Development", "Web Design", "JavaScript"],
            languages: ["English", "Spanish"],
            experience: 12,
            hourlyRate: 5000, 
            isVerified: true,
            isApproved: true,
            rating: 4.9,
            totalReviews: 124,
            totalStudents: 1500,
            availability: {
                monday: ["09:00-17:00"],
                tuesday: ["09:00-17:00"],
            },
        } as any,
        update: {
            expertise: ["Development", "Web Design", "JavaScript"],
            experience: 12,
        },
    });

    await prisma.teacherProfile.upsert({
        where: { userId: teacher2.id },
        create: {
            userId: teacher2.id,
            bio: "Expert React and Node.js developer with a passion for teaching.",
            expertise: ["Development", "React", "Node.js"],
            languages: ["English", "Mandarin"],
            experience: 8,
            hourlyRate: 4500,
            isVerified: true,
            isApproved: true,
            rating: 4.8,
            totalReviews: 89,
            totalStudents: 800,
            availability: {
                wednesday: ["10:00-14:00"],
                thursday: ["10:00-14:00"],
            },
        } as any,
        update: {
            expertise: ["Development", "React", "Node.js"],
            experience: 8,
        },
    });

    // 2.5 Seed Expertise and Languages
    const expertiseList = ["Development", "Design", "Business", "Marketing", "Web Design", "JavaScript", "React", "Node.js", "Python", "Data Science"];
    const languageList = ["English", "Spanish", "Mandarin", "French", "German", "Hindi", "Japanese"];

    for (const exp of expertiseList) {
        await prisma.expertise.upsert({
            where: { name: exp },
            update: { isActive: true },
            create: { name: exp, isActive: true }
        });
    }

    for (const lang of languageList) {
        await prisma.language.upsert({
            where: { name: lang },
            update: { isActive: true },
            create: { name: lang, isActive: true }
        });
    }

    // 3. Create Categories
    const categories = [
        { name: "Development", slug: "development", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085" },
        { name: "Design", slug: "design", image: "https://images.unsplash.com/photo-1561070791-2526d30994b5" },
        { name: "Business", slug: "business", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f" },
        { name: "Marketing", slug: "marketing", image: "https://images.unsplash.com/photo-1533750516457-a7f992034fec" },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        });
    }

    // 4. Create Featured Courses
    const devCategory = await prisma.category.findUnique({ where: { slug: "development" } });

    const courses = [
        {
            title: "Complete Web Development Bootcamp 2026",
            slug: "complete-web-development-bootcamp",
            description: "Become a full-stack web developer with just one course. HTML, CSS, Javascript, Node, React, MongoDB and more!",
            smallDescription: "Learn Web Development from scratch.",
            price: 4999, // $49.99
            duration: 600, // 10 hours
            level: "Beginner",
            isFeatured: true,
            status: "Published",
            image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1000&auto=format&fit=crop",
            categoryId: devCategory?.id,
        },
        {
            title: "Advanced React Patterns and Performance",
            slug: "advanced-react-patterns",
            description: "Level up your React skills with advanced patterns, performance optimization techniques, and state management.",
            smallDescription: "Master React.js concepts.",
            price: 6999,
            duration: 450,
            level: "Advanced",
            isFeatured: true,
            status: "Published",
            image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1000&auto=format&fit=crop",
            categoryId: devCategory?.id,
        },
        {
            title: "UI/UX Design Masterclass",
            slug: "ui-ux-design-masterclass",
            description: "Learn to design beautiful interfaces and user experiences. Figma, Adobe XD, and design principles.",
            smallDescription: "Design stunning user interfaces.",
            price: 3999,
            duration: 300,
            level: "Beginner",
            isFeatured: true,
            status: "Published",
            image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=1000&auto=format&fit=crop",
            categoryId: devCategory?.id, // Fallback to dev if design cat missing, but it should be there
        },
        {
            title: "Digital Marketing Strategy",
            slug: "digital-marketing-strategy",
            description: "Master digital marketing: SEO, Social Media Marketing, Email Marketing, and Analytics.",
            smallDescription: "Grow your business online.",
            price: 2999,
            duration: 200,
            level: "Beginner",
            isFeatured: true,
            status: "Published",
            image: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?q=80&w=1000&auto=format&fit=crop",
            categoryId: devCategory?.id,
        }
    ];

    for (const courseData of courses) {
        const { image, ...data } = courseData;
        // Note: Schema uses 'fileKey' for image/video usually, but FeaturedCourses used 'image' prop.
        // We'll map 'image' to 'fileKey' for now as a URL, assuming the app handles URLs in fileKey
        // OR we should fix the frontend to expect what the DB has.
        // Let's assume fileKey can hold a URL for this demo seed.

        // Check if course exists
        const existing = await prisma.course.findUnique({ where: { slug: data.slug } });
        if (!existing) {
            await prisma.course.create({
                data: {
                    ...data,
                    fileKey: image, // Using image URL as fileKey
                    userId: teacher.id,
                    // categoryId: data.categoryId!, // handled below
                    category: "Development", // Legacy/String field
                    categoryId: data.categoryId, // Direct assignment
                    tags: ["web", "development", "featured"],
                    learningOutcomes: ["Build websites", "Master JavaScript"],
                    averageRating: 4.8,
                    totalReviews: 42,
                    chapter: {
                        create: {
                            title: "Introduction",
                            position: 1,
                            lessons: {
                                create: {
                                    title: "Welcome to the course",
                                    position: 1,
                                    description: "Course overview"
                                }
                            }
                        }
                    }
                } as any // casting to bypass strict typing of potentially missing optional fields in this quick seed
            });
        }
    }

    // 5. Create Live Sessions
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(10, 0, 0, 0);

    const sessions = [
        {
            title: "Live Q&A: React Server Components",
            description: "Join us for a deep dive into RSCs and how they change web development.",
            scheduledAt: tomorrow,
            duration: 60,
            price: 1000,
            status: "scheduled",
        },
        {
            title: "Portfolio Review Session",
            description: "Get feedback on your portfolio from industry experts.",
            scheduledAt: nextWeek,
            duration: 90,
            price: 1500,
            status: "scheduled",
        }
    ];

    for (const session of sessions) {
        // Check if similar session exists to avoid dupes on re-run
        const existing = await prisma.liveSession.findFirst({
            where: {
                title: session.title,
                teacherId: teacherProfile.id
            }
        });

        if (!existing) {
            await prisma.liveSession.create({
                data: {
                    ...session,
                    teacherId: teacherProfile.id, // We know this exists from step 2
                    meetingUrl: "https://meet.google.com/abc-defg-hij",
                } as any
            });
        }
    }

    // 6. Create Reviews (Testimonials)
    const dbCourses = await prisma.course.findMany({ include: { user: true } });
    const students = [admin]; // Using admin as a student reviewer for now, normally would seed specific students

    const reviews = [
        {
            rating: 5,
            title: "Incredible Learning Experience",
            comment: "The courses here are top-notch. I've learned so much in such a short time.",
            isVerified: true
        },
        {
            rating: 5,
            title: "Career Transforming",
            comment: "Thanks to the coding bootcamps, I was able to switch careers and land my dream job.",
            isVerified: true
        },
        {
            rating: 4,
            title: "Comprehensive Content",
            comment: "Very detailed and well-structured. Highly recommend for beginners.",
            isVerified: true
        }
    ];

    for (const course of dbCourses) {
        for (const review of reviews) {
            const existingReview = await prisma.review.findFirst({
                where: {
                    courseId: course.id,
                    reviewerId: admin.id,
                    title: review.title
                }
            });

            if (!existingReview) {
                await prisma.review.create({
                    data: {
                        ...review,
                        courseId: course.id,
                        reviewerId: admin.id,
                    }
                });
            }
        }
    }

    console.log("✅ Seeding completed successfully. Database is ready for production.");
}

main()
    .catch((e) => {
        console.error("❌ Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
