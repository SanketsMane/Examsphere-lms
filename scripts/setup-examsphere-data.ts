/**
 * One-off data setup for the VisionIT client issues (BUG-0005, BUG-0008).
 *
 *   npx tsx scripts/setup-examsphere-data.ts           # dry run: prints what would change
 *   npx tsx scripts/setup-examsphere-data.ts --apply   # makes the changes
 *
 * - Creates the ExamSphere course categories (JEE, NEET, Foundation (Class 6–10), MBBS) and
 *   deactivates the generic ones (Development, Music, Photography…) so Browse Courses only
 *   offers real programmes. Categories are deactivated, never deleted.
 * - Moves courses whose category is not an ExamSphere one onto the matching programme, judged
 *   by the course title (e.g. "Neet" → NEET). Courses it can't place are listed, not changed.
 * - Fills the empty teacher Expertise and Language lists so admins can manage them in
 *   /admin/metadata. Existing rows are left alone.
 *
 * Safe to run more than once.
 */
import { PrismaClient } from "@prisma/client";
import {
  EXPERTISE_AREAS,
  PROGRAM_CATEGORIES,
  PROGRAM_CATEGORY_NAMES,
  TEACHING_LANGUAGES,
} from "../lib/examsphere-taxonomy";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

// Title keywords → programme. Checked in order; the first match wins.
const TITLE_RULES: [RegExp, string][] = [
  [/\bneet\b/i, "NEET"],
  [/\bjee\b/i, "JEE"],
  [/\bmbbs\b/i, "MBBS"],
  [/\b(foundation|class\s*(6|7|8|9|10))\b/i, "Foundation (Class 6–10)"],
];

async function main() {
  console.log(apply ? "Applying changes…\n" : "Dry run — nothing will be written. Pass --apply to make changes.\n");

  // 1. Programme categories
  const categoryIds = new Map<string, string>();
  for (const [index, c] of PROGRAM_CATEGORIES.entries()) {
    const existing = await prisma.category.findFirst({
      where: { OR: [{ slug: c.slug }, { name: c.name }] },
    });
    if (existing && existing.isActive && existing.name === c.name && existing.displayOrder === index) {
      categoryIds.set(c.name, existing.id);
      continue;
    }
    console.log(`${existing ? "update" : "create"} category: ${c.name}`);
    if (apply) {
      const row = existing
        ? await prisma.category.update({
            where: { id: existing.id },
            data: { name: c.name, isActive: true, displayOrder: index, parentId: null },
          })
        : await prisma.category.create({
            data: { name: c.name, slug: c.slug, description: c.description, displayOrder: index },
          });
      categoryIds.set(c.name, row.id);
    } else if (existing) {
      categoryIds.set(c.name, existing.id);
    }
  }

  const generic = await prisma.category.findMany({
    where: { isActive: true, name: { notIn: [...PROGRAM_CATEGORY_NAMES] } },
    select: { id: true, name: true },
  });
  if (generic.length) {
    console.log(`deactivate ${generic.length} generic categories: ${generic.map((c) => c.name).join(", ")}`);
    if (apply) {
      await prisma.category.updateMany({
        where: { id: { in: generic.map((c) => c.id) } },
        data: { isActive: false },
      });
    }
  }

  // 2. Courses outside the programme categories
  const courses = await prisma.course.findMany({
    where: { category: { notIn: [...PROGRAM_CATEGORY_NAMES] } },
    select: { id: true, title: true, category: true },
  });
  for (const course of courses) {
    const target = TITLE_RULES.find(([re]) => re.test(course.title))?.[1];
    if (!target) {
      console.log(`! course "${course.title}" (${course.category}) — no matching programme, left unchanged`);
      continue;
    }
    console.log(`move course "${course.title}": ${course.category} → ${target}`);
    if (apply) {
      await prisma.course.update({
        where: { id: course.id },
        data: { category: target, categoryId: categoryIds.get(target) ?? null },
      });
    }
  }

  // 3. Teacher signup options
  for (const [label, names, model] of [
    ["expertise", EXPERTISE_AREAS, prisma.expertise],
    ["languages", TEACHING_LANGUAGES, prisma.language],
  ] as const) {
    const count = await (model as typeof prisma.expertise).count();
    if (count > 0) {
      console.log(`${label}: ${count} rows already present, left unchanged`);
      continue;
    }
    console.log(`${label}: add ${names.length} defaults`);
    if (apply) {
      await (model as typeof prisma.expertise).createMany({
        data: names.map((name) => ({ name })),
        skipDuplicates: true,
      });
    }
  }

  console.log(apply ? "\nDone." : "\nDry run complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
