"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2, AlertTriangle } from "lucide-react";
import { format, startOfToday, isBefore, addHours } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const rescheduleSchema = z.object({
  scheduledDate: z.date({
    required_error: "Please select a date",
  }),
  scheduledTime: z.string().min(1, "Please select a time"),
  reason: z.string().min(10, "Please provide a reason (min 10 characters)"),
});

type RescheduleFormData = z.infer<typeof rescheduleSchema>;

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? "AM" : "PM";
  return {
    value: `${hour.toString().padStart(2, '0')}:${minute}`,
    label: `${displayHour}:${minute} ${ampm}`
  };
});

interface RescheduleFormProps {
  sessionId: string;
  currentScheduledAt: string;
}

export function RescheduleForm({ sessionId, currentScheduledAt }: RescheduleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<RescheduleFormData>({
    resolver: zodResolver(rescheduleSchema),
  });

  const onSubmit = async (data: RescheduleFormData) => {
    try {
      setLoading(true);

      const [hours, minutes] = data.scheduledTime.split(':').map(Number);
      const newDate = new Date(data.scheduledDate);
      newDate.setHours(hours, minutes, 0, 0);

      // Validation: Must be 24h away from now (matching API policy)
      const now = new Date();
      if (isBefore(newDate, addHours(now, 24))) {
        toast.error("Sessions must be rescheduled at least 24 hours in advance");
        return;
      }

      const response = await fetch(`/api/teacher/sessions/${sessionId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newScheduledAt: newDate.toISOString(),
          reason: data.reason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reschedule session');
      }

      toast.success('Session rescheduled successfully!');
      router.push(`/teacher/sessions/${sessionId}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 rounded-lg p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="text-sm text-amber-800 dark:text-amber-400">
          <p className="font-semibold">Rescheduling Policy</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Must be done at least 24 hours before original session.</li>
            <li>Students will be notified automatically via email.</li>
            <li>Choose a time that works for both parties.</li>
          </ul>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>New Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setValue("scheduledDate", date as Date);
                }}
                disabled={(date) => isBefore(date, startOfToday())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.scheduledDate && (
            <p className="text-sm text-destructive">{errors.scheduledDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">New Time *</Label>
          <Select onValueChange={(value) => setValue("scheduledTime", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {TIME_SLOTS.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.scheduledTime && (
            <p className="text-sm text-destructive">{errors.scheduledTime.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason for Rescheduling *</Label>
        <Textarea
          id="reason"
          placeholder="Please explain why you're rescheduling (this will be sent to the student)..."
          rows={4}
          {...register("reason")}
        />
        {errors.reason && (
          <p className="text-sm text-destructive">{errors.reason.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reschedule Session
        </Button>
      </div>
    </form>
  );
}
