"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, startOfToday, isBefore } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const sessionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  subject: z.string().min(2, "Subject is required"),
  sessionType: z.enum(["specific", "available"]),
  scheduledDate: z.date().optional(),
  scheduledTime: z.string().optional(),
  duration: z.number().min(15, "Minimum 15 minutes").max(180, "Maximum 180 minutes"),
  price: z.number().min(5, "Minimum price is $5"),
  timezone: z.string(),
  isFreeTrialEligible: z.boolean().default(false),  // Free trial option - Author: Sanket
});

type SessionFormData = z.infer<typeof sessionSchema>;

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Programming",
  "Web Development",
  "Data Science",
  "English",
  "Business",
  "Marketing",
  "Design",
  "Other"
];

const DURATIONS = [
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

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

export function CreateSessionForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sessionType, setSessionType] = useState<"specific" | "available">("specific");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isFreeTrialEligible, setIsFreeTrialEligible] = useState(false);  // Free trial state - Author: Sanket

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema) as any,
    defaultValues: {
      sessionType: "specific",
      duration: 60,
      price: 50,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isFreeTrialEligible: false,
    }
  });

  const watchedDuration = watch("duration");
  const watchedPrice = watch("price");

  const onSubmit = async (data: SessionFormData) => {
    try {
      setLoading(true);

      // Validate specific session has date and time
      if (data.sessionType === "specific" && (!data.scheduledDate || !data.scheduledTime)) {
        toast.error("Please select date and time for the session");
        return;
      }

      // Combine date and time for specific sessions
      let scheduledAt: Date | undefined;
      if (data.sessionType === "specific" && data.scheduledDate && data.scheduledTime) {
        const [hours, minutes] = data.scheduledTime.split(':').map(Number);
        scheduledAt = new Date(data.scheduledDate);
        scheduledAt.setHours(hours, minutes, 0, 0);
      }

      const response = await fetch('/api/teacher/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          subject: data.subject,
          scheduledAt: scheduledAt?.toISOString(),
          duration: data.duration,
          price: Math.round(data.price * 100), // Convert to cents
          timezone: data.timezone,
          isAvailableSlot: data.sessionType === "available",
          isFreeTrialEligible: data.isFreeTrialEligible  // Include free trial flag - Author: Sanket
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
      }

      const result = await response.json();
      toast.success('Session created successfully!');
      router.push('/teacher/sessions');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Session Type */}
      <div className="space-y-3">
        <Label>Session Type</Label>
        <RadioGroup
          value={sessionType}
          onValueChange={(value: string) => {
            setSessionType(value as "specific" | "available");
            setValue("sessionType", value as "specific" | "available");
          }}
          className="grid grid-cols-2 gap-4"
        >
          <div>
            <RadioGroupItem
              value="specific"
              id="specific"
              className="peer sr-only"
            />
            <Label
              htmlFor="specific"
              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <CalendarIcon className="mb-3 h-6 w-6" />
              <div className="text-center">
                <p className="font-semibold">Specific Time</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Schedule for a specific date and time
                </p>
              </div>
            </Label>
          </div>
          <div>
            <RadioGroupItem
              value="available"
              id="available"
              className="peer sr-only"
            />
            <Label
              htmlFor="available"
              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <CalendarIcon className="mb-3 h-6 w-6" />
              <div className="text-center">
                <p className="font-semibold">Available Slot</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Students can book anytime
                </p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Session Title *</Label>
        <Input
          id="title"
          placeholder="e.g., React Hooks Deep Dive"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe what students will learn in this session..."
          rows={4}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject">Subject *</Label>
        <Select onValueChange={(value) => setValue("subject", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.subject && (
          <p className="text-sm text-destructive">{errors.subject.message}</p>
        )}
      </div>

      {/* Date and Time (only for specific sessions) */}
      {sessionType === "specific" ? (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date *</Label>
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
                    setValue("scheduledDate", date);
                  }}
                  disabled={(date) => isBefore(date, startOfToday())}
                  modifiers={{
                    past: (date) => isBefore(date, startOfToday()),
                  }}
                  modifiersClassNames={{
                    past: "text-red-500 opacity-100 font-bold hover:bg-transparent pointer-events-none",
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time *</Label>
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
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-6 text-center space-y-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit mx-auto">
            <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Set Recurring Availability</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-1">
              To let students book sessions anytime, set up your weekly recurring schedule.
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            onClick={() => router.push("/teacher/sessions/availability")}
          >
            Manage Weekly Schedule
          </Button>
        </div>
      )}

      {/* Duration and Price */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration *</Label>
          <Select
            defaultValue="60"
            onValueChange={(value) => setValue("duration", Number(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((duration) => (
                <SelectItem key={duration.value} value={duration.value.toString()}>
                  {duration.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.duration && (
            <p className="text-sm text-destructive">{errors.duration.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price (INR) *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ₹
            </span>
            <Input
              id="price"
              type="number"
              min="100"
              step="1"
              className="pl-7"
              placeholder="500"
              {...register("price", { valueAsNumber: true })}
            />
          </div>
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>
      </div>

      {/* Free Trial Option - Author: Sanket */}
      <div className="flex items-start space-x-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-4">
        <Checkbox
          id="isFreeTrialEligible"
          checked={isFreeTrialEligible}
          onCheckedChange={(checked) => {
            setIsFreeTrialEligible(checked as boolean);
            setValue("isFreeTrialEligible", checked as boolean);
          }}
          className="mt-1"
        />
        <div className="flex-1">
          <Label
            htmlFor="isFreeTrialEligible"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Offer as Free Trial Session
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Students can book this session for free (one free trial per student with you).
            Great for attracting new students!
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <h3 className="font-semibold mb-3">Session Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">{watchedDuration} minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price:</span>
            <span className="font-medium">${watchedPrice || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">You&apos;ll receive (after 15% fee):</span>
            <span className="font-semibold text-green-600">
              ₹{((watchedPrice || 0) * 0.85).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select
          defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
          onValueChange={(value) => setValue("timezone", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
            <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
            <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
            <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
            <SelectItem value="Europe/London">London (GMT)</SelectItem>
            <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
            <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
            <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
            <SelectItem value="UTC">UTC</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sessionType === "specific" && (
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
            Create Session
          </Button>
        </div>
      )}
    </form>
  );
}
