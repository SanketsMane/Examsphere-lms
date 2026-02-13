"use client";

import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added to fetch user country - Author: Sanket
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { bookSessionAction, bookSessionWithWallet } from "@/app/actions/book-session";
import { useRazorpay } from "@/components/payment/use-razorpay";
import { PaymentSelectionDialog } from "@/components/payment/PaymentSelectionDialog";

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
    const { data: session } = authClient.useSession(); // Fetch user session for country - Author: Sanket
    const userCountry = (session?.user as any)?.country;

    const [selectedDate, setSelectedDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() + 1))); // Tomorrow
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [couponCode, setCouponCode] = useState("");
    const [isPending, startTransition] = useTransition();
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    
    // Payment Hooks
    const { openCheckout } = useRazorpay();

    const handleBook = () => {
        if (!selectedSlot) {
            toast.error("Please select a time slot");
            return;
        }

        // If paid session, open payment dialog
        if (hourlyRate > 0) {
            setShowPaymentDialog(true);
        } else {
            // Free session direct booking
            processFreeBooking();
        }
    };

    const processFreeBooking = () => {
        startTransition(async () => {
            try {
                const dateTimeStr = `${format(selectedDate, 'yyyy-MM-dd')} ${selectedSlot}`;
                const result = await bookSessionAction({
                    teacherProfileId,
                    dateTime: dateTimeStr,
                    couponCode: couponCode || undefined
                });

                if (result.success && result.sessionId) {
                    toast.success("Session Booked Successfully!");
                    window.location.href = `/video-call/${result.sessionId}`;
                } else {
                    toast.error(result.error || "Failed to book session");
                }
            } catch (e) {
                toast.error("Something went wrong");
            }
        });
    };

    const handlePaymentCheckout = async () => {
        try {
            const dateTimeStr = `${format(selectedDate, 'yyyy-MM-dd')} ${selectedSlot}`;
            
            // Create Checkout Session
            const response = await fetch("/api/checkout/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacherProfileId,
                    dateTime: dateTimeStr,
                    couponCode: couponCode || undefined
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to initiate checkout");
            }

            const data = await response.json();

            // Open Razorpay
            await openCheckout({
                orderId: data.orderId,
                keyId: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: "1-on-1 Session",
                description: `Session with ${userName}`,
                user: data.user,
                onSuccess: (paymentId) => {
                    toast.success("Payment Successful! Redirecting...");
                    window.location.href = "/dashboard/sessions?booking=success";
                },
                onError: (err) => {
                    toast.error("Payment failed. Please try again.");
                }
            });
             setShowPaymentDialog(false);

        } catch (error: any) {
            toast.error(error.message || "Checkout failed");
        }
    };

    const handleWalletPayment = async () => {
        try {
            const dateTimeStr = `${format(selectedDate, 'yyyy-MM-dd')} ${selectedSlot}`;
             const result = await bookSessionWithWallet({
                teacherProfileId,
                dateTime: dateTimeStr,
                couponCode: couponCode || undefined
            });

            if (result.success && result.sessionId) {
                toast.success("Paid via Wallet! Redirecting...");
                window.location.href = `/video-call/${result.sessionId}`;
            } else {
                throw new Error(result.error || "Wallet payment failed");
            }
             setShowPaymentDialog(false);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="bg-card border border-border rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Book a Session</h3>
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
                <span className="text-muted-foreground">Hourly Rate</span>
                <span className="text-2xl font-bold text-primary">
                    {formatPriceSimple(hourlyRate, userCountry)}
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
                        <div className="text-center p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/25">
                            <p className="text-muted-foreground text-sm">No slots available for this date.</p>
                            <p className="text-xs text-muted-foreground mt-1">Please contact the instructor.</p>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t">
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Discount Coupon</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Enter Code"
                            className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none focus:border-primary uppercase"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        />
                    </div>
                </div>
            </div>

            <Button
                className="w-full py-6 text-lg font-bold shadow-md"
                onClick={handleBook}
                disabled={!selectedSlot || isPending}
            >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (hourlyRate > 0 ? "Proceed to Pay" : "Book Now")}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
                100% Satisfaction Guarantee. Cancel up to 24h before.
            </p>

            <PaymentSelectionDialog
                open={showPaymentDialog}
                onOpenChange={setShowPaymentDialog}
                amount={hourlyRate}
                itemType="session"
                itemTitle={`Session with ${userName}`}
                onPaymentCheckout={handlePaymentCheckout}
                onWalletPayment={handleWalletPayment}
            />
        </div>
    );
}
