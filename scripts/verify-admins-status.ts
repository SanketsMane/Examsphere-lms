
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAdmins() {
    const emails = ["bksun170882@gmail.com", "contactsanket1@gmail.com"];
    
    console.log("Checking admin status for:", emails);

    const users = await prisma.user.findMany({
        where: {
            email: { in: emails }
        },
        select: {
            email: true,
            role: true,
            name: true
        }
    });

    console.table(users);
}

checkAdmins()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
