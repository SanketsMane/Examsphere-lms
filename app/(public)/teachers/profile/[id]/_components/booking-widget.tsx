"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { bookSessionAction } from "@/app/actions/book-session";;

interface BookingWidgetProps {
    teacherProfileId: string;
    teacherId: string;
    hourlyRate: number;
    userName: string;
    availableSlots?: { id: string; time: string; label: string }[];
}

export function BookingWidget({
    teacherProfileId,
    hourlyRate,
    userName,
    availableSlots = []
}: BookingWidgetProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() + 1))); // Tomorrow
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleBook = () => {
        if (!selectedSlot) return;

        startTransition(async () => {
            try {
                // Construct a proper Date object from selectedDate + selectedSlot time
                // For demo, we just pass the string or construct loosely
                const dateTimeStr = `${format(selectedDate, 'yyyy-MM-dd')} ${selectedSlot}`;

                const result = await bookSessionAction({
                    teacherProfileId,
                    dateTime: dateTimeStr,
                    price: hourlyRate
                });

                if (result.success && result.sessionId) {
                    toast.success("Session Booked Successfully!");
                    // Redirect to success or session page
                    window.location.href = `/video-call/${result.sessionId}`; // Direct to call or dashboard
                } else {
                    toast.error(result.error || "Failed to book session");
                }
            } catch (e) {
                toast.error("Something went wrong");
            }
        });
    };

    return (
        <div className="bg-card border border-border rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Book a Session</h3>
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
                <span className="text-muted-foreground">Hourly Rate</span>
                <span className="text-2xl font-bold text-primary">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(hourlyRate)}
                </span>
            </div>

            <div className="space-y-4 mb-6">
                <div>
                    <label className="text-sm font-medium mb-2 block">Available Date</label>
                    <div className="p-3 border border-border rounded-lg flex items-center gap-2 bg-secondary/20">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        <span>{format(selectedDate, 'PPP')}</span>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium mb-3 block">Select Time Slot</label>
                    {availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {availableSlots.map(slot => (
                                <button
                                    key={slot.id}
                                    onClick={() => setSelectedSlot(slot.time)}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2
                                        ${selectedSlot === slot.time
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border hover:border-primary/50'
                                        }
                                    `}
                                >
                                    <Clock className="w-3 h-3" />
                                    {slot.time}
                                </button>
                            ))}
                        </div>
                    ) : (
                        // Fallback slots if none provided
                        <div className="grid grid-cols-2 gap-3">
                            {["10:00 AM", "2:00 PM", "4:00 PM"].map(time => (
                                <button
                                    key={time}
                                    onClick={() => setSelectedSlot(time)}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2
                                        ${selectedSlot === time
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border hover:border-primary/50'
                                        }
                                    `}
                                >
                                    <Clock className="w-3 h-3" />
                                    {time}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Button
                className="w-full py-6 text-lg font-bold shadow-md"
                onClick={handleBook}
                disabled={!selectedSlot || isPending}
            >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Book Now"}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
                100% Satisfaction Guarantee. Cancel up to 24h before.
            </p>
        </div>
    );
}
