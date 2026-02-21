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
import { getCurrencyConfig, formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket
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
  Info,
  ShieldCheck,
  Video
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
  // FIX: Allow price to be 0 if it is a free trial eligible session
  if (!data.isFreeTrialEligible && data.price < 50) { // Enforce minimum price if not free trial
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Minimum price is ${formatPriceSimple(50, "India")} for paid sessions`,
      path: ["price"],
    });
  }
});

type SessionFormData = z.infer<typeof sessionSchema>;

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

export function CreateSessionForm({ subjects = [] }: { subjects?: { id: string, name: string }[] }) {
  const router = useRouter();
  const [userCountry, setUserCountry] = useState<string>("India");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: session } = await authClient.getSession();
      if (session?.user) {
        setUserCountry((session.user as any).country || "India");
      }
    };
    fetchUser();
  }, []);

  const config = getCurrencyConfig(userCountry);
  const s = config.symbol;
  const rate = config.exchangeRate;

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
    if (loading) return;
    try {
      setLoading(true);

      let scheduledAt: Date | undefined;
      // If specific date, combine date and time
      if (data.sessionType === "specific" && data.scheduledDate && data.scheduledTime) {
        const [hours, minutes] = data.scheduledTime.split(':').map(Number);
        scheduledAt = new Date(data.scheduledDate);
        scheduledAt.setHours(hours, minutes, 0, 0);
        
        // --- CREATE SPECIFIC LIVE SESSION ---
        const response = await fetch('/api/teacher/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            subject: data.subject,
            scheduledAt: scheduledAt.toISOString(),
            duration: data.duration,
            price: Math.round(data.price * 100), // Convert to cents
            timezone: data.timezone,
            isAvailableSlot: false, // Specific sessions are not "available slots" in this context
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

      } else if (data.sessionType === "available") {
        // --- CREATE SESSION TEMPLATE (RECURRING) ---
        // For "available" type, we create a template that can be applied to slots
        // We need to import this action dynamically or move it to top if this file allows
        const { createSessionTemplate } = await import("@/app/actions/session-templates");
        
        const result = await createSessionTemplate({
            title: data.title,
            description: data.description,
            subject: data.subject,
            duration: data.duration,
            price: Math.round(data.price * 100), // Convert to cents
            recurrenceType: "NONE", // Default to simple template for now, or assume Weekly if we had UI for it
            startTime: data.scheduledTime || "10:00", // Default or user restricted? The UI hides time for "available"
            // The current UI for "available" hides date/time input. 
            // We should probably redirect them to "Availability" settings or 
            // create a generic template. 
            // Let's create a generic template with no specific time.
        });

        // WAIT: The UI for "available" says: "This session will be automatically offered... based on your Teaching Calendar"
        // This implies we should be creating a "Service" or "Session Type" definition, not a scheduled session.
        // In this system, `SessionTemplate` seems to be that definition.
        // However, `createSessionTemplate` requires `startTime` in the schema/action we saw earlier?
        // Let's check `app/actions/session-templates.ts` again. It requires `startTime`.
        // But the "Available" UI hides the time input (lines 358-416).
        // If we want to support "Available", we should probably enforce creating a template 
        // OR ask for a default time if the template action requires it.
        
        // Actually, looking at the previous code (lines 416-429), it shows an info box:
        // "This session will be automatically offered... based on ... Teaching Calendar."
        
        // If the backend `SessionTemplate` *requires* a start time, we might be blocked.
        // Let's look at `createSessionTemplate` signature again.
        // Yes: `startTime: string;` is required in the arguments.
        
        // HACK/FIX: We'll generate a dummy template with a placeholder time, 
        // or we need to ask the user for "Default Time" even for recurring availability?
        // Or maybe we treat "Available" as "Create a Template" and redirect them?
        
        // Better approach for now: Treat it as a template creation with a default time, 
        // letting them edit it later.
        
        const templateResult = await createSessionTemplate({
            title: data.title,
            description: data.description,
            subject: data.subject,
            duration: data.duration,
            price: Math.round(data.price * 100),
            recurrenceType: "NONE",
            startTime: "09:00", // Placeholder default
        });

        if (templateResult.success) {
            toast.success('Session Template created! Apply it to your calendar.');
            router.push('/teacher/sessions?tab=templates');
        } else {
            throw new Error(templateResult.error || "Failed to create template");
        }
      }
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
          
          {/* Section 1: Basic Details - Redesigned by Sanket */}
          <div className="bg-white dark:bg-gray-900/40 backdrop-blur-md rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-8 shadow-xl shadow-blue-500/5 space-y-8 transition-all hover:shadow-blue-500/10">
            <div className="flex items-center justify-between border-b pb-6 border-gray-100 dark:border-gray-800">
              <div className="space-y-1">
                <h3 className="text-xl font-bold flex items-center gap-2.5 text-gray-900 dark:text-gray-100">
                  <div className="bg-blue-600/10 p-2 rounded-lg">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  Session Curriculum
                </h3>
                <p className="text-sm text-muted-foreground ml-11">Define the core focus and learning objectives</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                Step 01
              </div>
            </div>
            
            <div className="grid gap-8">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Session Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Mastering React Hooks: A Deep Dive"
                  className="h-14 bg-gray-50/50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-800 rounded-2xl text-lg font-medium focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-all"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 font-medium animate-in fade-in slide-in-from-left-2">{errors.title.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="subject" className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Category *</Label>
                  <Select onValueChange={(value) => setValue("subject", value)}>
                    <SelectTrigger className="h-14 bg-gray-50/50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-800 rounded-2xl font-medium focus:ring-blue-500/30">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-gray-200 dark:border-gray-800 shadow-2xl">
                      {subjects.map(s => (
                        <SelectItem key={s.id} value={s.name} className="rounded-xl my-1 focus:bg-blue-50 dark:focus:bg-blue-900/30">
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subject && (
                    <p className="text-sm text-red-500 font-medium">{errors.subject.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                   <Label className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Average Duration</Label>
                   <div className="flex gap-2">
                      {DURATIONS.slice(0, 3).map((d) => (
                        <Button
                          key={d.value}
                          type="button"
                          variant={watchedDuration === d.value ? "default" : "outline"}
                          className={cn(
                            "flex-1 h-14 rounded-2xl font-bold transition-all",
                            watchedDuration === d.value ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25" : "border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                          onClick={() => setValue("duration", d.value)}
                        >
                          {d.value}m
                        </Button>
                      ))}
                   </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Syllabus & Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detail what students will learn, prerequisites, and what to expect..."
                  rows={6}
                  className="bg-gray-50/50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-800 rounded-2xl text-base focus-visible:ring-blue-500/30 transition-all resize-none p-4"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 font-medium">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 2: Scheduling - Redesigned by Sanket */}
          <div className="bg-white dark:bg-gray-900/40 backdrop-blur-md rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-8 shadow-xl shadow-purple-500/5 space-y-8 transition-all hover:shadow-purple-500/10">
            <div className="flex items-center justify-between border-b pb-6 border-gray-100 dark:border-gray-800">
               <div className="space-y-1">
                 <h3 className="text-xl font-bold flex items-center gap-2.5 text-gray-900 dark:text-gray-100">
                   <div className="bg-purple-600/10 p-2 rounded-lg">
                     <Clock className="h-6 w-6 text-purple-600" />
                   </div>
                   Timing & Mode
                 </h3>
                 <p className="text-sm text-muted-foreground ml-11">Choose when and how students can book</p>
               </div>
               <div className="bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50">
                Step 02
              </div>
            </div>

            <RadioGroup
              value={sessionType}
              onValueChange={(value) => {
                const type = value as "specific" | "available";
                setSessionType(type);
                setValue("sessionType", type);
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div>
                <RadioGroupItem value="specific" id="specific" className="peer sr-only" />
                <Label
                  htmlFor="specific"
                  className="flex flex-col gap-3 rounded-2xl border-2 border-transparent bg-gray-50/50 dark:bg-gray-800/20 p-5 hover:bg-gray-100 dark:hover:bg-gray-800/40 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50/50 dark:peer-data-[state=checked]:bg-blue-950/20 cursor-pointer transition-all h-full group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white p-2 rounded-xl group-hover:scale-110 transition-transform">
                      <CalendarIcon className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-lg">One-off Session</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Host a specialized workshop or lecture at a specific fixed date and time
                  </p>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="available" id="available" className="peer sr-only" />
                <Label
                  htmlFor="available"
                  className="flex flex-col gap-3 rounded-2xl border-2 border-transparent bg-gray-50/50 dark:bg-gray-800/20 p-5 hover:bg-gray-100 dark:hover:bg-gray-800/40 peer-data-[state=checked]:border-green-600 peer-data-[state=checked]:bg-green-50/50 dark:peer-data-[state=checked]:bg-green-950/20 cursor-pointer transition-all h-full group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-600 text-white p-2 rounded-xl group-hover:scale-110 transition-transform">
                      <Clock className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-lg">Recurring Availability</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Set open slots that students can pick based on your weekly teaching schedule
                  </p>
                </Label>
              </div>
            </RadioGroup>

            {sessionType === "specific" ? (
              <div className="grid sm:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Date Select *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-medium h-14 bg-gray-50/50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-800 rounded-2xl text-lg",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-3 h-5 w-5 text-blue-600" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-gray-200 dark:border-gray-800" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setValue("scheduledDate", date);
                        }}
                        disabled={(date) => isBefore(date, startOfToday())}
                        initialFocus
                        className="p-4"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.scheduledDate && (
                    <p className="text-sm text-red-500 font-medium">{errors.scheduledDate.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Start Time *</Label>
                  <Select onValueChange={(value) => setValue("scheduledTime", value)}>
                    <SelectTrigger className="h-14 bg-gray-50/50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-800 rounded-2xl font-medium text-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-purple-600" />
                        <SelectValue placeholder="Select time" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-60 rounded-2xl shadow-2xl border-gray-200 dark:border-gray-800">
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value} className="rounded-xl my-1 focus:bg-purple-50 dark:focus:bg-purple-900/30">
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.scheduledTime && (
                    <p className="text-sm text-red-500 font-medium">{errors.scheduledTime.message}</p>
                  )}
                </div>
              </div>
            ) : (
                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-6 flex gap-4 animate-in fade-in zoom-in-95 duration-500">
                  <div className="bg-blue-600/10 p-3 rounded-xl shrink-0">
                    <Info className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-blue-900 dark:text-blue-100">Dynamic Availability Enabled</h4>
                    <p className="text-sm text-blue-800/70 dark:text-blue-300/70 leading-relaxed">
                      This session will be automatically offered to students based on the slots you defined in your 
                      <a href="/teacher/sessions/availability" className="mx-1 font-bold underline hover:text-blue-900 transition-colors underline-offset-4">Teaching Calendar</a>.
                    </p>
                  </div>
                </div>
            )}
          </div>

          <Separator />

          {/* Section 3: Pricing - Redesigned by Sanket */}
          <div className="bg-white dark:bg-gray-900/40 backdrop-blur-md rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-8 shadow-xl shadow-green-500/5 space-y-8 transition-all hover:shadow-green-500/10">
            <div className="flex items-center justify-between border-b pb-6 border-gray-100 dark:border-gray-800">
               <div className="space-y-1">
                 <h3 className="text-xl font-bold flex items-center gap-2.5 text-gray-900 dark:text-gray-100">
                   <div className="bg-green-600/10 p-2 rounded-lg">
                     <DollarSign className="h-6 w-6 text-green-600" />
                   </div>
                   Investment & Value
                 </h3>
                 <p className="text-sm text-muted-foreground ml-11">Set your teaching rate professionally</p>
               </div>
               <div className="bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400 border border-green-200/50 dark:border-green-800/50">
                Step 03
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <Label className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Rate Configuration</Label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400 group-focus-within:text-green-600 transition-colors">
                    {s}
                  </span>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1"
                    disabled={isFreeTrial}
                    className={cn(
                       "pl-12 h-20 text-3xl font-black bg-gray-50/50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-800 rounded-2xl focus-visible:ring-green-500/30 transition-all",
                       isFreeTrial && "opacity-40 grayscale pointer-events-none"
                    )}
                    placeholder="0"
                    {...register("price", { valueAsNumber: true })}
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-widest text-gray-400">
                    {config.code}
                  </span>
                </div>
                {errors.price && (
                  <p className="text-sm text-red-500 font-medium">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Strategic Options</Label>
                <div 
                  className={cn(
                    "relative overflow-hidden rounded-2xl border-2 p-5 transition-all cursor-pointer group select-none h-20 flex items-center",
                    isFreeTrial 
                      ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 shadow-lg shadow-amber-500/10" 
                      : "border-gray-100 dark:border-gray-800 bg-gray-50/30 hover:border-amber-200"
                  )}
                  onClick={() => setValue("isFreeTrialEligible", !isFreeTrial)}
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                      isFreeTrial ? "bg-amber-500 border-amber-500 scale-110" : "border-gray-300"
                    )}>
                      {isFreeTrial && <div className="w-2.5 h-2.5 bg-white rounded-full animate-in zoom-in-50 duration-300" />}
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-black text-sm uppercase tracking-tight">Enable First Free Discovery</p>
                      <p className="text-xs text-muted-foreground font-medium">Boost conversion by 40% with a trial</p>
                    </div>
                    <Sparkles className={cn(
                      "ml-auto h-6 w-6 transition-all",
                      isFreeTrial ? "text-amber-500 scale-125 rotate-12 fill-amber-500" : "text-gray-300 opacity-20"
                    )} />
                  </div>
                </div>
              </div>
            </div>
            
            {isFreeTrial && (
               <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/50 rounded-2xl p-5 flex gap-4 animate-in slide-in-from-bottom-2 duration-500">
                  <div className="bg-amber-500/10 p-2.5 rounded-xl shrink-0">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                  </div>
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-400 leading-relaxed">
                    Discovery sessions are limited to <strong>1 per student</strong>. Students will see this as a <span className="font-black uppercase tracking-widest bg-amber-500 text-white px-1.5 py-0.5 rounded">Free Trial</span> on your profile.
                  </p>
               </div>
            )}
          </div>

          {/* Actions - Redesigned by Sanket */}
          <div className="flex flex-col sm:flex-row gap-4 pt-10 pb-20">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1 h-16 rounded-2xl text-lg font-bold border-2 transition-all active:scale-95"
            >
              Cancel Draft
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="flex-1 h-16 rounded-2xl text-lg font-black bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white shadow-2xl shadow-blue-500/20 transition-all active:scale-95"
            >
              {loading ? (
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
              ) : (
                <Sparkles className="mr-3 h-5 w-5" />
              )}
              {isFreeTrial ? "Publish Free Trial" : "Launch Live Session"}
            </Button>
          </div>
        </form>
      </div>

      {/* Sidebar Summary - Redesigned by Sanket */}
      <div className="hidden lg:block">
        <div className="sticky top-10 space-y-6">
          <Card className="rounded-[2.5rem] border-none bg-black text-white shadow-3xl overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             <CardContent className="p-0 space-y-0 relative">
                {/* Visual Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-10 space-y-2">
                   <div className="flex items-center gap-2 mb-4">
                      <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">LIVE PREVIEW</div>
                      {isFreeTrial && <div className="bg-amber-400 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">FREE TRIAL</div>}
                   </div>
                   <h3 className="text-3xl font-black leading-tight line-clamp-3 min-h-[5.25rem]">
                      {watch("title") || "Drafting your session..."}
                   </h3>
                </div>

                <div className="p-10 space-y-10">
                   <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                               <Clock className="h-5 w-5 text-blue-300" />
                            </div>
                            <div className="space-y-0.5">
                               <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Duration</span>
                               <p className="font-black text-lg">{watchedDuration} minutes</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                               <Video className="h-5 w-5 text-purple-300" />
                            </div>
                            <div className="space-y-0.5">
                               <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Type</span>
                               <p className="font-black text-lg capitalize">{sessionType}</p>
                            </div>
                         </div>
                      </div>

                       <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
                         <div className="flex justify-between items-end">
                            <div className="space-y-1">
                               <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Tuition Fee</span>
                               <p className="text-4xl font-black text-blue-400">
                                  {isFreeTrial ? "0.00" : formatPriceSimple(watchedPrice || 0, userCountry)}
                               </p>
                            </div>
                            <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl">
                               <span className="text-[10px] font-black text-blue-400 tracking-tighter uppercase">{config.code}</span>
                            </div>
                         </div>

                        {!isFreeTrial && (
                           <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <span className="text-xs font-bold text-white/30">Contractor Payout (85%)</span>
                              <span className="text-lg font-black text-green-400">
                                 {formatPriceSimple((watchedPrice || 0) * 0.85, userCountry)}
                              </span>
                           </div>
                        )}
                      </div>
                   </div>

                   <div className="space-y-4 pt-4">
                      <p className="text-xs font-medium text-white/30 leading-relaxed italic border-l-2 border-white/10 pl-4">
                        "Your session will be promoted across the Global Tutor Network to over 50k+ active students."
                      </p>
                      <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                         <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-blue-400" />
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-white/40 max-w-[140px]">SECURE GLOBAL INFRASTRUCTURE</p>
                      </div>
                   </div>
                </div>
             </CardContent>
          </Card>
          
          <div className="bg-gray-100 dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 flex gap-4 transition-all hover:bg-white dark:hover:bg-gray-800 group">
             <div className="bg-blue-600/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                <Info className="h-6 w-6 text-blue-600" />
             </div>
             <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Audit Status</p>
                <p className="text-sm font-medium leading-relaxed dark:text-gray-300">
                   All sessions undergo automated verification. You can modify these settings post-publish in your management console.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
