"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  NOTE_LANGUAGES,
  noteFormSchema,
  slugify,
  type NoteFormInput,
  type NoteFormValues,
} from "@/lib/notes/validation";
import { createNoteAction, updateNoteAction } from "../actions";

interface Props {
  mode: "create" | "edit";
  noteId?: string;
  defaults?: Partial<NoteFormInput>;
  programs: readonly string[];
  subjects: readonly string[];
}

const ACCESS_HELP: Record<string, string> = {
  FREE: "Any signed-in student can read. Good for lead generation.",
  PAID: "Sold on its own. Can also be included with linked courses.",
  COURSE_ONLY: "Only students enrolled in a linked course can read. Not sold separately.",
};

export function NoteForm({ mode, noteId, defaults, programs, subjects }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<NoteFormInput, unknown, NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      shortDescription: "",
      description: "",
      program: "",
      subject: "",
      chapter: "",
      language: "English",
      accessType: "PAID",
      priceRupees: 0,
      discountPriceRupees: undefined,
      previewPages: 2,
      allowDownload: false,
      maxDownloads: 3,
      isFeatured: false,
      ...defaults,
    },
  });
  const accessType = form.watch("accessType");
  const allowDownload = form.watch("allowDownload");

  function onSubmit(values: NoteFormValues) {
    startTransition(async () => {
      const result = mode === "create" ? await createNoteAction(values) : await updateNoteAction(noteId!, values);
      if (result.status !== "success") {
        for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(name as keyof NoteFormInput, { message });
        }
        toast.error(result.message ?? "Could not save");
        return;
      }
      toast.success(result.message ?? "Saved");
      if (mode === "create") router.push(`/admin/notes/${result.data.id}`);
      else router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="grid items-start gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="NEET Biology – Cell Structure & Function (Complete Notes)"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      if (mode === "create" && !form.getFieldState("slug").isDirty) {
                        form.setValue("slug", slugify(e.target.value));
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>URL slug</FormLabel>
                <FormControl>
                  <Input placeholder="neet-biology-cell-structure" {...field} />
                </FormControl>
                <FormDescription>examsphere.online/notes/{field.value || "…"}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shortDescription"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>One-line summary</FormLabel>
                <FormControl>
                  <Input placeholder="All NCERT-level concepts with diagrams, mnemonics and PYQ tips" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>What&apos;s inside</FormLabel>
                <FormControl>
                  <Textarea rows={6} placeholder={"• Topics covered\n• Who it's for\n• How it helps in the exam"} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="grid items-start gap-5 md:grid-cols-4">
          <FormField
            control={form.control}
            name="program"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Programme</FormLabel>
                <FormControl>
                  <Input list="note-programs" placeholder="NEET" {...field} />
                </FormControl>
                <datalist id="note-programs">{programs.map((p) => <option key={p} value={p} />)}</datalist>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input list="note-subjects" placeholder="Biology" {...field} />
                </FormControl>
                <datalist id="note-subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="chapter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chapter / topic</FormLabel>
                <FormControl>
                  <Input placeholder="Cell: The Unit of Life" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {NOTE_LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-5 rounded-2xl border border-border p-5">
          <h3 className="font-display text-lg font-bold">Pricing &amp; access</h3>
          <div className="grid items-start gap-5 md:grid-cols-3">
            <FormField
              control={form.control}
              name="accessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="FREE">Free</SelectItem>
                      <SelectItem value="COURSE_ONLY">Course only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>{ACCESS_HELP[field.value]}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {accessType === "PAID" && (
              <>
                <FormField
                  control={form.control}
                  name="priceRupees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} step={1} {...field} value={field.value as number | string} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountPriceRupees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offer price (₹, optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          value={(field.value as number | string | undefined) ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>Shown with the original price struck through.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>

          <div className="grid items-start gap-5 md:grid-cols-3">
            <FormField
              control={form.control}
              name="previewPages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Free preview pages</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={20} step={1} {...field} value={field.value as number | string} />
                  </FormControl>
                  <FormDescription>0 turns the preview off.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allowDownload"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>Allow download</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormDescription>Downloads are watermarked with the student&apos;s email.</FormDescription>
                </FormItem>
              )}
            />
            {allowDownload && (
              <FormField
                control={form.control}
                name="maxDownloads"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Downloads per student</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={50} step={1} {...field} value={field.value as number | string} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="isFeatured"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Feature at the top of the catalogue</FormLabel>
              </FormItem>
            )}
          />
        </section>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {mode === "create" ? "Create note" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
