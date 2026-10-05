"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { XCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { differenceInHours } from "date-fns";
import { formatMoney } from "@/lib/money";

// Booking amounts are stored in paise
const formatPaise = (paise: number) => formatMoney(paise / 100, { showDecimals: paise % 100 !== 0 });

interface CancelBookingDialogProps {
  bookingId: string;
  sessionDate: Date;
  amount: number;
  children?: React.ReactNode;
}

export function CancelBookingDialog({ 
  bookingId, 
  sessionDate, 
  amount,
  children 
}: CancelBookingDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  const hoursUntilSession = differenceInHours(new Date(sessionDate), new Date());
  
  let refundPercentage = 0;
  if (hoursUntilSession >= 48) {
    refundPercentage = 100;
  } else if (hoursUntilSession >= 24) {
    refundPercentage = 50;
  }

  const estimatedRefund = (amount * refundPercentage) / 100;

  const handleCancel = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel booking');
      }

      const result = await response.json();
      
      toast.success(
        `Booking cancelled successfully! ${
          result.refundAmount > 0 
            ? `Refund of ${formatPaise(result.refundAmount)} will be processed within 5-10 business days.`
            : 'No refund applicable due to cancellation policy.'
        }`
      );
      
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children || (
          <Button variant="destructive" size="sm">
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Booking
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel This Session?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Your booking will be cancelled based on our cancellation policy.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 my-4">
          {/* Refund Info */}
          <div className={`rounded-lg p-4 ${
            refundPercentage === 100 
              ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900'
              : refundPercentage === 50
              ? 'bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900'
              : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900'
          }`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`h-5 w-5 mt-0.5 ${
                refundPercentage === 100
                  ? 'text-green-600 dark:text-green-400'
                  : refundPercentage === 50
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }`} />
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">
                  {refundPercentage}% Refund
                </p>
                <p className="text-sm text-muted-foreground">
                  {refundPercentage > 0 ? (
                    <>
                      You'll receive <span className="font-bold">{formatPaise(Math.round(estimatedRefund))}</span> back
                      {refundPercentage === 100 
                        ? ' (full refund - cancelled 48+ hours before)'
                        : ' (partial refund - cancelled 24-48 hours before)'
                      }
                    </>
                  ) : (
                    <>No refund available (less than 24 hours before session)</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Let us know why you're cancelling..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Keep Booking</AlertDialogCancel>
          <Button
            onClick={handleCancel}
            disabled={loading}
            variant="destructive"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Cancellation
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
