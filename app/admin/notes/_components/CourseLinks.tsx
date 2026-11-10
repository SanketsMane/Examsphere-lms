"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setCourseLinksAction } from "../actions";

interface Course {
  id: string;
  title: string;
  status: string;
}

interface Props {
  noteId: string;
  courses: Course[];
  initial: { courseId: string; includedWithCourse: boolean }[];
}

export function CourseLinks({ noteId, courses, initial }: Props) {
  const router = useRouter();
  const [links, setLinks] = useState(initial);
  const [adding, setAdding] = useState("");
  const [pending, startTransition] = useTransition();
  const byId = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  const available = courses.filter((c) => !links.some((l) => l.courseId === c.id));
  const dirty = JSON.stringify(links) !== JSON.stringify(initial);

  function save() {
    startTransition(async () => {
      const result = await setCourseLinksAction(noteId, links);
      if (result.status === "success") {
        toast.success(result.message);
        router.refresh();
      } else toast.error(result.message);
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Link courses to show these notes on the course page. When <strong>included</strong> is on, enrolled students get the notes
        at no extra cost.
      </p>

      {links.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No courses linked.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {links.map((l) => {
            const c = byId.get(l.courseId);
            return (
              <li key={l.courseId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c?.title ?? "(deleted course)"}</p>
                  {c && c.status !== "Published" && <p className="text-xs text-orange-600">Course is {c.status.toLowerCase()}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={l.includedWithCourse}
                      onCheckedChange={(v) => setLinks((all) => all.map((x) => (x.courseId === l.courseId ? { ...x, includedWithCourse: v } : x)))}
                    />
                    Included
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove course"
                    onClick={() => setLinks((all) => all.filter((x) => x.courseId !== l.courseId))}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={adding} onValueChange={setAdding}>
          <SelectTrigger className="sm:max-w-md">
            <SelectValue placeholder={available.length ? "Choose a course" : "All courses are linked"} />
          </SelectTrigger>
          <SelectContent>
            {available.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          disabled={!adding}
          onClick={() => {
            setLinks((all) => [...all, { courseId: adding, includedWithCourse: true }]);
            setAdding("");
          }}
        >
          <Plus className="mr-2 size-4" /> Add course
        </Button>
        <Button onClick={save} disabled={!dirty || pending} className="sm:ml-auto">
          {pending && <Loader2 className="mr-2 size-4 animate-spin" />} Save links
        </Button>
      </div>
    </div>
  );
}
