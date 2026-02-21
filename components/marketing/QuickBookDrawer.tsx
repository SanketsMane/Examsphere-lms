"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Clock, CalendarDays, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRazorpay } from "@/components/payment/use-razorpay";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket
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
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);
    const [fetchedSlots, setFetchedSlots] = useState<{ id: string; time: string; label: string }[]>([]);
    const { openCheckout } = useRazorpay();
    const router = useRouter();
    const [imgSrc, setImgSrc] = useState(teacher.image);
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

    // Fetch slots when date changes
    useEffect(() => {
        const fetchSlots = async () => {
            if (!date) return;
            
            setIsFetchingSlots(true);
            setTimeSlot(undefined); // Reset selection
            try {
                // Determine timezone (browser default for now, or use teacher's preference if passed)
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const dateStr = format(date, 'yyyy-MM-dd');
                
                const res = await fetch(`/api/public/teachers/${teacher.id}/availability?date=${dateStr}&timezone=${timezone}`);
                if (res.ok) {
                    const data = await res.json();
                    setFetchedSlots(data.slots || []);
                }
            } catch (e) {
                console.error("Failed to fetch slots", e);
                toast.error("Could not load availability");
            } finally {
                setIsFetchingSlots(false);
            }
        }
        
        fetchSlots();
    }, [date, teacher.id]);

    const handlePayment = async () => {
        if (!date || !timeSlot) return;

        setIsLoading(true);
        try {
            // Find the selected slot object to get the ISO string if available, 
            // otherwise parse the label/time string.
            // Our API returns slots with 'id' as ISO string.
            const selectedSlotObj = fetchedSlots.find(s => s.time === timeSlot || s.label === timeSlot);
            
            let dateTimeStr: string;
            
            if (selectedSlotObj && selectedSlotObj.id.includes('T')) {
                 dateTimeStr = selectedSlotObj.id;
            } else {
                 // Fallback parsing (should not happen with new API)
                 // Parse Time Slot to get Hours/Minutes
                const [time, period] = timeSlot.split(' ');
                let [hours, minutes] = time.split(':').map(Number);
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
    
                const bookingDate = new Date(date);
                bookingDate.setHours(hours, minutes, 0, 0);
                dateTimeStr = bookingDate.toISOString();
            }

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
                            
                            {isFetchingSlots ? (
                                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading slots...
                                </div>
                            ) : fetchedSlots.length > 0 ? (
                                <RadioGroup onValueChange={setTimeSlot} className="grid grid-cols-3 gap-2">
                                    {fetchedSlots.map((slot) => (
                                        <div key={slot.id}>
                                            <RadioGroupItem value={slot.time} id={slot.id} className="peer sr-only" />
                                            <Label
                                                htmlFor={slot.id}
                                                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-transparent p-2 hover:bg-primary/5 hover:border-primary/50 cursor-pointer transition-all text-xs font-medium text-center peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-white shadow-sm"
                                            >
                                                {slot.label}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm bg-muted/20 rounded-lg border border-dashed">
                                    No slots available for this date.
                                </div>
                            )}
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
                                        {fetchedSlots.find(s => s.time === timeSlot)?.label || timeSlot || "---"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Cost Summary */}
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Rate (1 Hour)</span>
                                <span className="font-bold">{formatPriceSimple(teacher.hourlyRate, userCountry)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Platform Fee</span>
                                <span className="font-bold text-green-600">FREE</span>
                            </div>
                            <div className="border-t border-blue-100 dark:border-blue-900/20 pt-2 flex justify-between font-bold text-lg text-blue-700 dark:text-blue-300">
                                <span>Total</span>
                                <span className="font-bold">{formatPriceSimple(teacher.hourlyRate, userCountry)}</span>
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
