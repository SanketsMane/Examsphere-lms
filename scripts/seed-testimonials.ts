
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding testimonials...");

    const testimonials = [
        {
            name: "Alex Johnson",
            role: "Software Developer",
            content: "ExamSphere has transformed the way I learn. The courses are top-notch and the instructors are very knowledgeable.",
            image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=2574&auto=format&fit=crop",
            isFeatured: true,
            isActive: true,
        },
        {
            name: "Sarah Williams",
            role: "Product Manager",
            content: "I love the flexibility ExamSphere offers. I can learn at my own pace and the community is very supportive.",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=2574&auto=format&fit=crop",
            isFeatured: true,
            isActive: true,
        },
        {
            name: "Michael Brown",
            role: "Data Scientist",
            content: "The data science curriculum is excellent. The hands-on projects helped me build a strong portfolio.",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2574&auto=format&fit=crop",
            isFeatured: true,
            isActive: true,
        },
        {
            name: "Emily Davis",
            role: "UX Designer",
            content: "The design courses are very practical. I learned a lot about user research and prototyping.",
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2574&auto=format&fit=crop",
            isFeatured: true,
            isActive: true,
        },
        {
            name: "David Wilson",
            role: "Digital Marketer",
            content: "The marketing strategies I learned here helped me grow my business by 200% in just 6 months.",
            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2574&auto=format&fit=crop",
            isFeatured: true,
            isActive: true,
        },
        {
            name: "Lisa Anderson",
            role: "Graphic Designer",
            content: "I've taken several design courses and they are all excellent. The instructors are real pros.",
            image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=2574&auto=format&fit=crop",
            isFeatured: true,
            isActive: true,
        },
        {
            name: "James Taylor",
            role: "Web Developer",
            content: "The web development bootcamp is intense but worth it. I landed a job at a top tech company.",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2574&auto=format&fit=crop",
            isFeatured: true,
            isActive: true,
        },
        {
            name: "Sophia Martinez",
            role: "Content Writer",
            content: "I improved my writing skills significantly. The feedback from instructors is very detailed.",
            image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2574&auto=format&fit=crop",
            isFeatured: true,
            isActive: true,
        },
        {
            name: "Daniel White",
            role: "Entrepreneur",
            content: "The business courses gave me the confidence to start my own company. Highly recommended!",
            image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=2574&auto=format&fit=crop",
            isFeatured: true,
            isActive: true,
        },
    ];

    for (const t of testimonials) {
        await prisma.testimonial.create({
            data: t,
        });
    }

    console.log("Seeding completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
