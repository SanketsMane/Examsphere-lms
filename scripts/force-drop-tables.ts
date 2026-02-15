import { prisma } from "../lib/db";

async function forceDrop() {
  console.log("🔥 [FORCE DROP] Starting destructive cleanup...");
  try {
    // Disable triggers to ignore foreign keys during drop
    await prisma.$executeRawUnsafe(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
        
        FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
          EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    console.log("✅ [FORCE DROP] All tables and enums in 'public' schema dropped.");
  } catch (error) {
    console.error("❌ [FORCE DROP] Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

forceDrop();
