"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  DollarSign,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

interface BookingPageClientProps {
  session: {
    id: string;
    title: string;
    description: string | null;
    subject: string | null;
    scheduledAt: Date | null;
    duration: number;
    price: number;
    teacher: {
      timezone: string | null;
      user: {
        name: string;
        image: string | null;
      };
    };
  };
}

import { useRazorpay } from "@/components/payment/use-razorpay";
import { PaymentSelectionDialog } from "@/components/payment/PaymentSelectionDialog"; // Added for Wallet Integration - Author: Sanket
import { joinGroupClass } from "@/app/actions/groups"; // Added for Wallet Integration - Author: Sanket

export function BookingPageClient({ session }: BookingPageClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToRefund, setAgreedToRefund] = useState(false);
  const { openCheckout } = useRazorpay();
  
  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discountAmount: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const [showPaymentDialog, setShowPaymentDialog] = useState(false); // Added for Wallet Integration - Author: Sanket

  // ... (handleApplyCoupon omitted for brevity, but let's keep it if we need to replace a range)
  
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
        const res = await fetch("/api/coupons/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code: couponCode,
                originalPrice: session.price,
                context: {
                    type: "SESSION", 
                    teacherId: "unknown" 
                }
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invalid coupon");

        setAppliedCoupon({
            id: data.couponId,
            code: data.code,
            discountAmount: data.discountAmount
        });
        toast.success("Coupon applied successfully!");
    } catch (error: any) {
        toast.error(error.message);
        setAppliedCoupon(null);
    } finally {
        setValidatingCoupon(false);
    }
  };

  const handleOpenPaymentDialog = () => {
    if (!agreedToTerms || !agreedToRefund) {
      toast.error("Please agree to the terms and refund policy");
      return;
    }
    setShowPaymentDialog(true);
  };

  const initiateRazorpayCheckout = async () => {
    try {
      setLoading(true);

      // Create checkout session
      const response = await fetch(`/api/groups/${session.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            couponCode: appliedCoupon?.code
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      if (data.url && data.isFree) {
          // Free session - redirect directly
          window.location.href = data.url;
          return;
      }

      // Open Razorpay Checkout
      await openCheckout({
        orderId: data.orderId,
        keyId: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Session Booking",
        description: data.courseDescription,
        user: data.user,
        onSuccess: (paymentId) => {
            toast.success("Booking confirmed! Redirecting...");
            setTimeout(() => {
                window.location.href = "/dashboard/sessions?booking=success";
            }, 2000);
        },
        onError: (err) => {
            toast.error("Payment failed. Please try again.");
            setLoading(false);
        }
      });
      setShowPaymentDialog(false);

    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleWalletPayment = async () => {
      try {
          // Call Server Action
          const result = await joinGroupClass(session.id, "wallet", appliedCoupon?.code) as any;

          if (result.success) {
              toast.success("Joined successfully via Wallet!");
              setTimeout(() => {
                  window.location.href = "/dashboard/groups?booking=success";
              }, 1500);
          } else {
              throw new Error(result.error || "Wallet payment failed");
          }
          setShowPaymentDialog(false);
      } catch (error: any) {
          toast.error(error.message);
      }
  };

  const platformFee = Math.round(session.price * 0.05); // 5% platform fee
  const total = session.price;
  const finalTotal = appliedCoupon ? (total - appliedCoupon.discountAmount) : total;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 max-w-4xl">
        {/* Back Button */}
        <Link href={`/live-sessions/${session.id}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Session
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8">Complete Your Booking</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={session.teacher.user.image || undefined} />
                    <AvatarFallback>
                      {session.teacher.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2">{session.subject}</Badge>
                    <h3 className="font-bold text-lg mb-1">{session.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      with {session.teacher.user.name}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  {session.scheduledAt && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {format(session.scheduledAt, "EEEE, MMMM dd, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(session.scheduledAt, "h:mm a")} ({session.teacher?.timezone || 'UTC'})
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{session.duration} minutes</p>
                      <p className="text-sm text-muted-foreground">Live video session</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Important Information */}
            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      Important Information
                    </p>
                    <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                      <li>• You'll receive a confirmation email with session link</li>
                      <li>• Join from any device with internet connection</li>
                      <li>• Recording will be available for 7 days</li>
                      <li>• Session reminder sent 24 hours before</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Refund Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cancellation & Refund Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Full Refund (100%)</p>
                    <p className="text-muted-foreground">Cancel 48+ hours before session</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Partial Refund (50%)</p>
                    <p className="text-muted-foreground">Cancel 24-48 hours before session</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">No Refund</p>
                    <p className="text-muted-foreground">Cancel less than 24 hours before</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms Agreement */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    I agree to the{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="refund"
                    checked={agreedToRefund}
                    onCheckedChange={(checked) => setAgreedToRefund(checked as boolean)}
                  />
                  <label htmlFor="refund" className="text-sm leading-relaxed cursor-pointer">
                    I understand the cancellation and refund policy outlined above
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Session Price</span>
                      <span className="font-medium">${(session.price / 100).toFixed(2)}</span>
                    </div>

                     {/* Coupon Section */}
                    {appliedCoupon ? (
                         <div className="flex justify-between text-green-600">
                             <div className="flex items-center gap-1">
                                 <span className="text-sm">Coupon ({appliedCoupon.code})</span>
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => setAppliedCoupon(null)}
                                 >
                                    <span className="sr-only">Remove</span>
                                    ×
                                 </Button>
                             </div>
                             <span className="font-medium">-${(appliedCoupon.discountAmount / 100).toFixed(2)}</span>
                         </div>
                    ) : (
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <input 
                                    type="text" 
                                    placeholder="Discount Code"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                />
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleApplyCoupon}
                                disabled={validatingCoupon || !couponCode}
                            >
                                {validatingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                            </Button>
                        </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform Fee (5%)</span>
                      <span className="font-medium">${(platformFee / 100).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Total</span>
                      <div className="text-right">
                        <div className="font-bold text-2xl text-green-600">
                          ${(finalTotal / 100).toFixed(2)}
                        </div>
                        <span className="text-xs text-muted-foreground">USD</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleOpenPaymentDialog}
                    disabled={loading || !agreedToTerms || !agreedToRefund}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 h-5 w-5" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>

                  <PaymentSelectionDialog 
                      open={showPaymentDialog}
                      onOpenChange={setShowPaymentDialog}
                      amount={finalTotal}
                      itemType="session"
                      itemTitle={session.title}
                      onPaymentCheckout={initiateRazorpayCheckout}
                      onWalletPayment={handleWalletPayment}
                  />

                  <p className="text-xs text-center text-muted-foreground">
                    You'll be redirected to Stripe for secure payment
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
