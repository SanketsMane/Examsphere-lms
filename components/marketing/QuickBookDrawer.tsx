"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Clock, CalendarDays, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRazorpay } from "@/components/payment/use-razorpay";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface QuickBookDrawerProps {
    teacher: {
        id: string; // This is teacher.id (TeacherProfile ID) ? Correct.
        name: string;
        image: string;
        headline: string;
        hourlyRate: number;
    };
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function QuickBookDrawer({ teacher, trigger, open, onOpenChange }: QuickBookDrawerProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [timeSlot, setTimeSlot] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const { openCheckout } = useRazorpay();
    const router = useRouter();
    const [imgSrc, setImgSrc] = useState(teacher.image);

    const timeSlots = [
        "09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "06:00 PM"
    ];

    const handlePayment = async () => {
        if (!date || !timeSlot) return;

        setIsLoading(true);
        try {
            // Parse Time Slot to get Hours/Minutes
            const [time, period] = timeSlot.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            const bookingDate = new Date(date);
            bookingDate.setHours(hours, minutes, 0, 0);
            
            // Send ISO String to ensure backend parses it correctly
            const dateTimeStr = bookingDate.toISOString();

            const response = await fetch("/api/checkout/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacherProfileId: teacher.id,
                    dateTime: dateTimeStr,
                    couponCode: "" // Support coupon later if needed
                })
            });

            if (response.status === 401) {
                toast.error("Please login to book a session");
                router.push("/login?callbackUrl=" + window.location.pathname);
                return;
            }

            if (!response.ok) {
                const error = await response.text();
                toast.error(error || "Failed to initiate booking");
                return;
            }

            const orderData = await response.json();

            // Handle Free Session (Bypass Razorpay)
            if (orderData.isFree) {
                toast.success("Booking Confirmed!");
                if (onOpenChange) onOpenChange(false);
                router.push("/dashboard/sessions");
                return;
            }

            await openCheckout({
                orderId: orderData.orderId,
                keyId: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: orderData.courseName,
                description: orderData.courseDescription,
                user: orderData.user,
                onSuccess: (paymentId) => {
                    toast.success("Booking Confirmed!");
                    if (onOpenChange) onOpenChange(false);
                    router.push("/dashboard/sessions");
                },
                onError: (error) => {
                    toast.error("Payment Failed");
                    console.error(error);
                }
            });

        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            {trigger && (
                <SheetTrigger asChild>
                    {trigger}
                </SheetTrigger>
            )}
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-white dark:bg-card">
                <SheetHeader className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <Image
                            src={imgSrc}
                            alt={teacher.name}
                            width={50}
                            height={50}
                            className="rounded-full object-cover border-2 border-primary/10 w-12 h-12"
                            onError={() => setImgSrc("https://ui-avatars.com/api/?name=" + teacher.name)}
                        />
                        <div>
                            <SheetTitle className="text-lg font-bold">Book a Trial with {teacher.name.split(' ')[0]}</SheetTitle>
                            <SheetDescription className="text-xs">{teacher.headline}</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                        {/* Date Selection */}
                        <div className="space-y-3">
                            <Label className="font-bold flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-primary" /> Select Date
                            </Label>
                            <div className="border rounded-xl p-3 bg-gray-50/50 dark:bg-muted/20">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && setDate(d)}
                                    className="rounded-md border-0 w-full flex justify-center"
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    required
                                />
                            </div>
                        </div>

                        {/* Time Selection */}
                        <div className="space-y-3">
                            <Label className="font-bold flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" /> Select Time (IST)
                            </Label>
                            <RadioGroup onValueChange={setTimeSlot} className="grid grid-cols-3 gap-2">
                                {timeSlots.map((time) => (
                                    <div key={time}>
                                        <RadioGroupItem value={time} id={time} className="peer sr-only" />
                                        <Label
                                            htmlFor={time}
                                            className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-transparent p-2 hover:bg-primary/5 hover:border-primary/50 cursor-pointer transition-all text-xs font-medium text-center peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-white shadow-sm"
                                        >
                                            {time}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        {/* Summary & Feedback */}
                        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl space-y-2">
                            <p className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3" /> Selected Slot
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-card p-2 rounded-md border flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Date</span>
                                    <span className="text-sm font-semibold text-primary">
                                        {date ? format(date, "MMM d, yyyy") : "---"}
                                    </span>
                                </div>
                                <div className="bg-white dark:bg-card p-2 rounded-md border flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Time</span>
                                    <span className="text-sm font-semibold text-primary">
                                        {timeSlot || "---"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Cost Summary */}
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Rate (1 Hour)</span>
                                <span className="font-bold">₹{teacher.hourlyRate}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Platform Fee</span>
                                <span className="font-bold text-green-600">FREE</span>
                            </div>
                            <div className="border-t border-blue-100 dark:border-blue-900/20 pt-2 flex justify-between font-bold text-lg text-blue-700 dark:text-blue-300">
                                <span>Total</span>
                                <span>₹{teacher.hourlyRate}</span>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <SheetFooter className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-muted/10">
                    <Button
                        className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
                        disabled={!date || !timeSlot || isLoading}
                        onClick={handlePayment}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                            </>
                        ) : (
                            <>
                                Proceed to Payment <ArrowRight className="ml-2 w-4 h-4" />
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
