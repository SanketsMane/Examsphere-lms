"use client";

import { useState, useEffect } from "react";
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
import { 
  CalendarIcon, 
  Loader2, 
  BookOpen, 
  Clock, 
  DollarSign, 
  Sparkles,
  Info
} from "lucide-react";
import { format, startOfToday, isBefore } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

// Schema with conditional validation for price
const sessionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  sessionType: z.enum(["specific", "available"]),
  scheduledDate: z.date().optional(),
  scheduledTime: z.string().optional(),
  duration: z.number().min(15).max(180),
  price: z.number().min(0, "Price cannot be negative"),
  timezone: z.string(),
  isFreeTrialEligible: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.sessionType === "specific" && (!data.scheduledDate || !data.scheduledTime)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Date and time are required for specific sessions",
      path: ["scheduledDate"],
    });
  }
  if (!data.isFreeTrialEligible && data.price < 50) { // Enforce minimum price if not free trial
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Minimum price is ₹50 for paid sessions",
      path: ["price"],
    });
  }
});

type SessionFormData = z.infer<typeof sessionSchema>;

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "Programming", "Web Development", "Data Science", "English",
  "Business", "Marketing", "Design", "Music", "Art", "Other"
];

const DURATIONS = [
  { value: 30, label: "30 Minutes (Quick)" },
  { value: 45, label: "45 Minutes (Standard)" },
  { value: 60, label: "1 Hour (Deep Dive)" },
  { value: 90, label: "1.5 Hours (Extended)" },
  { value: 120, label: "2 Hours (Workshop)" },
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
      price: 500,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isFreeTrialEligible: false,
    }
  });

  const watchedDuration = watch("duration");
  const watchedPrice = watch("price");
  const isFreeTrial = watch("isFreeTrialEligible");

  // Effect to handle price when free trial is toggled
  useEffect(() => {
    if (isFreeTrial) {
      setValue("price", 0);
    } else if (watchedPrice === 0) {
      setValue("price", 500); // Reset to default if unchecking and price was 0
    }
  }, [isFreeTrial, setValue]); // watchedPrice omitted to prevent loop

  const onSubmit = async (data: SessionFormData) => {
    try {
      setLoading(true);

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
          isFreeTrialEligible: data.isFreeTrialEligible
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
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Main Form Area */}
      <div className="lg:col-span-2 space-y-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Section 1: Basic Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Session Basics
              </h3>
              <p className="text-sm text-muted-foreground">What will you be teaching?</p>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Session Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Mastering React Hooks: A Deep Dive"
                  className="h-11"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select onValueChange={(value) => setValue("subject", value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a subject category" />
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

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detail what students will learn, prerequisites, and what to expect..."
                  rows={5}
                  className="resize-none"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 2: Scheduling */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Scheduling & Duration
              </h3>
              <p className="text-sm text-muted-foreground">When will this happen?</p>
            </div>

            <RadioGroup
              value={sessionType}
              onValueChange={(value) => {
                const type = value as "specific" | "available";
                setSessionType(type);
                setValue("sessionType", type);
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="specific" id="specific" className="peer sr-only" />
                <Label
                  htmlFor="specific"
                  className="flex flex-col gap-2 rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50/50 dark:peer-data-[state=checked]:bg-blue-950/20 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Specific Time</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Schedule for a single, fixed date and time
                  </p>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="available" id="available" className="peer sr-only" />
                <Label
                  htmlFor="available"
                  className="flex flex-col gap-2 rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-green-600 peer-data-[state=checked]:bg-green-50/50 dark:peer-data-[state=checked]:bg-green-950/20 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Open Slot</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Create a slot that stays open until booked
                  </p>
                </Label>
              </div>
            </RadioGroup>

            {sessionType === "specific" ? (
              <div className="grid sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-11",
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
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.scheduledDate && (
                    <p className="text-sm text-destructive">{errors.scheduledDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Select onValueChange={(value) => setValue("scheduledTime", value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select start time" />
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
            ) : (
                <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle>Availability-based Booking</AlertTitle>
                  <AlertDescription>
                    This session will appear on your profile. Students can book it based on your <a href="/teacher/sessions/availability" className="underline font-medium hover:text-blue-800">weekly availability</a> schedule.
                  </AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                defaultValue="60"
                onValueChange={(value) => setValue("duration", Number(value))}
              >
                <SelectTrigger className="h-11">
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
            </div>
          </div>

          <Separator />

          {/* Section 3: Pricing */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Pricing
              </h3>
              <p className="text-sm text-muted-foreground">Set your rate or offer a free trial</p>
            </div>

            <Card className={cn(
               "border-2 transition-colors",
               isFreeTrial ? "border-amber-400 bg-amber-50/30 dark:bg-amber-950/10" : "border-border"
            )}>
              <CardContent className="p-4 flex items-start gap-3">
                 <Checkbox
                    id="isFreeTrialEligible"
                    checked={isFreeTrial}
                    onCheckedChange={(checked) => {
                       setValue("isFreeTrialEligible", checked as boolean);
                    }}
                    className="mt-1"
                 />
                 <div className="space-y-1">
                    <Label 
                       htmlFor="isFreeTrialEligible" 
                       className="text-base font-semibold cursor-pointer flex items-center gap-2"
                    >
                       Offer as Free Trial Session
                       {isFreeTrial && <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                       Students can book this session for <strong>₹0</strong>. Limit: 1 per student.
                       <br/>
                       <span className="text-xs text-amber-700 dark:text-amber-500 font-medium">
                          Great for attracting new students and building your reputation!
                       </span>
                    </p>
                 </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="price">Price (INR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                  ₹
                </span>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  disabled={isFreeTrial}
                  className={cn(
                     "pl-8 h-11 text-lg font-medium",
                     isFreeTrial && "bg-muted text-muted-foreground opacity-70"
                  )}
                  placeholder="500"
                  {...register("price", { valueAsNumber: true })}
                />
              </div>
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-semibold"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isFreeTrial ? "Create Free Session" : "Create Session"}
            </Button>
          </div>
        </form>
      </div>

      {/* Sidebar Summary */}
      <div className="hidden lg:block space-y-6">
        <Card className="sticky top-6 border-l-4 border-l-indigo-500 shadow-sm">
           <CardContent className="p-6 space-y-6">
              <h3 className="font-semibold text-lg border-b pb-2">Session Preview</h3>
              
              <div className="space-y-4 text-sm">
                 <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Title</span>
                    <p className="font-medium line-clamp-2">
                       {watch("title") || "Untitled Session"}
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Duration</span>
                       <p className="font-medium">{watchedDuration} mins</p>
                    </div>
                    <div>
                       <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Type</span>
                       <p className="font-medium capitalize">{sessionType}</p>
                    </div>
                 </div>

                 <div className="pt-2">
                    <div className="flex justify-between items-baseline mb-1">
                       <span className="text-muted-foreground">Student Price</span>
                       <span className="text-xl font-bold">
                          {isFreeTrial ? "FREE" : `₹${watchedPrice || 0}`}
                       </span>
                    </div>
                    {!isFreeTrial && (
                       <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          <span>Your Earnings (85%)</span>
                          <span className="font-semibold text-green-600">
                             ₹{((watchedPrice || 0) * 0.85).toFixed(0)}
                          </span>
                       </div>
                    )}
                 </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                 <p className="flex gap-2">
                    <Info className="h-4 w-4 shrink-0" />
                    Sessions are reviewed automatically. You can edit details later from the dashboard.
                 </p>
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
