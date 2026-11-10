"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, ExternalLink, EyeOff, Loader2, Rocket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteNoteAction, setNoteStatusAction } from "../actions";

export function NoteStatusBar({ noteId, slug, status, hasFile, sold }: { noteId: string; slug: string; status: string; hasFile: boolean; sold: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(next: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
    startTransition(async () => {
      const r = await setNoteStatusAction(noteId, next);
      if (r.status === "success") {
        toast.success(r.message);
        router.refresh();
      } else toast.error(r.message);
    });
  }

  function remove() {
    startTransition(async () => {
      const r = await deleteNoteAction(noteId);
      if (r.status === "success") {
        toast.success(r.message);
        router.push("/admin/notes");
      } else toast.error(r.message);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/notes/${slug}`} target="_blank">
          <ExternalLink className="mr-2 size-4" /> View page
        </Link>
      </Button>
      {status !== "PUBLISHED" ? (
        <Button size="sm" onClick={() => run("PUBLISHED")} disabled={pending || !hasFile} title={hasFile ? undefined : "Upload the PDF first"}>
          {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Rocket className="mr-2 size-4" />} Publish
        </Button>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => run("DRAFT")} disabled={pending}>
          <EyeOff className="mr-2 size-4" /> Unpublish
        </Button>
      )}
      {status !== "ARCHIVED" && (
        <Button size="sm" variant="ghost" onClick={() => run("ARCHIVED")} disabled={pending}>
          <Archive className="mr-2 size-4" /> Archive
        </Button>
      )}
      {!sold && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={pending}>
              <Trash2 className="mr-2 size-4" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete these notes?</AlertDialogTitle>
              <AlertDialogDescription>The note, its files and its reading history are removed permanently.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={remove} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
