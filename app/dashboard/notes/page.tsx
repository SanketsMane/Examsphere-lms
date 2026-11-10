import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { requireUser } from "@/app/data/user/require-user";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/es/dashboard-kit";
import { NoteCard } from "@/components/notes/NoteCard";
import { coverUrl, getMyNotes } from "@/lib/notes/queries";

export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<string, string> = {
  PURCHASE: "Purchased",
  WALLET: "Purchased",
  FREE: "Free",
  COURSE: "With course",
  ADMIN_GRANT: "Gifted",
};

export default async function MyNotesPage() {
  const user = await requireUser();
  const items = await getMyNotes(user!.id);

  return (
    <div className="space-y-8">
      <PageHeader title="My Notes" subtitle="Notes you bought, claimed for free, or got with a course.">
        <Button asChild variant="outline">
          <Link href="/notes">Browse notes</Link>
        </Button>
      </PageHeader>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-16 text-center">
          <BookOpenText className="size-10 text-muted-foreground" />
          <p className="font-display text-lg font-bold">No notes yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Free notes, notes you buy, and notes included with your courses will all show up here.
          </p>
          <Button asChild className="mt-2">
            <Link href="/notes">Find notes</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
          {items.map(({ note, source, lastReadPage, courseTitle }) => (
            <NoteCard
              key={note.id}
              note={note}
              coverSrc={coverUrl(note)}
              href={`/dashboard/notes/${note.slug}`}
              footer={
                <span className="text-xs font-medium text-muted-foreground">
                  {lastReadPage ? `Continue at page ${lastReadPage}` : courseTitle ? `With ${courseTitle}` : SOURCE_LABEL[source] ?? "Ready to read"}
                </span>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
