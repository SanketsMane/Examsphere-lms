
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  console.log("Checking Prisma Client properties...");
  const keys = Object.keys(prisma);
  console.log("Available keys on prisma instance:", keys);
  
  // Also check prototype descriptors usually mostly on instance for dmmf stuff 
  // but simpler to check if we can access it.
  
  try {
      // @ts-ignore
      if (prisma.aiConversation) {
          console.log("✅ prisma.aiConversation exists");
      } else {
          console.error("❌ prisma.aiConversation is MISSING");
      }
      
      // @ts-ignore
      if (prisma.aiMessage) {
          console.log("✅ prisma.aiMessage exists");
      } else {
          console.error("❌ prisma.aiMessage is MISSING");
      }

  } catch (e) {
      console.error(e);
  }
}

check();
