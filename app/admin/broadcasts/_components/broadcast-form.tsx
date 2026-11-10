"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// import { Broadcast, BroadcastType } from "@prisma/client"; // Avoiding lint error
import { createBroadcast, updateBroadcast } from "@/app/actions/broadcasts";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Local type definition to satisfy IDE
export type BroadcastType = "Info" | "Offer" | "Alert" | "Coupon";

export interface BroadcastData {
    id: string;
    text: string;
    type: BroadcastType;
    link: string | null;
    buttonText: string | null;
    couponCode: string | null;
    isActive: boolean;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date | null;
}

const formSchema = z.object({
  text: z.string().min(1, "Text is required"),
  type: z.enum(["Info", "Offer", "Alert", "Coupon"]),
  link: z.string().optional(),
  buttonText: z.string().optional(),
  couponCode: z.string().optional(),
  priority: z.coerce.number<string | number>().default(0),
});

interface BroadcastFormProps {
    initialData?: BroadcastData;
    onSuccess: () => void;
}

export function BroadcastForm({ initialData, onSuccess }: BroadcastFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.input<typeof formSchema>, unknown, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: initialData?.text || "",
      type: (initialData?.type as any) || "Info",
      link: initialData?.link || "",
      buttonText: initialData?.buttonText || "",
      couponCode: initialData?.couponCode || "",
      priority: initialData?.priority ?? 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        if (initialData) {
            await updateBroadcast(initialData.id, values);
            toast.success("Broadcast updated");
        } else {
            await createBroadcast(values);
            toast.success("Broadcast created");
        }
        router.refresh();
        onSuccess();
    } catch (error) {
        toast.error("Something went wrong");
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message Text</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 50% OFF on all courses!" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="Info">Info</SelectItem>
                    <SelectItem value="Offer">Offer</SelectItem>
                    <SelectItem value="Alert">Alert</SelectItem>
                    <SelectItem value="Coupon">Coupon</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Higher shows first</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="couponCode"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Coupon Code (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="WELCOME50" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <div className="hidden"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Link URL (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="/courses/..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="buttonText"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Button Text (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="Enroll Now" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : initialData ? "Update" : "Create"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
