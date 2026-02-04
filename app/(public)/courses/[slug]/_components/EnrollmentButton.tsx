"use client";

import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { useTransition } from "react";
import { enrollInCourseAction } from "../actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useRazorpay } from "@/components/payment/use-razorpay";

export function EnrollmentButton({ courseId }: { courseId: string }) {
  const [pending, startTransition] = useTransition();
  const { openCheckout } = useRazorpay();

  function onSubmit() {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        enrollInCourseAction(courseId)
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "already_enrolled") {
        toast.success(result.message);
        return;
      }

      if (result.status === "success") {
        await openCheckout({
          orderId: result.orderId,
          keyId: result.keyId,
          amount: result.amount,
          currency: result.currency,
          name: "Course Enrollment",
          description: `Enrollment in ${result.courseName}`,
          user: result.user,
          onSuccess: (paymentId) => {
            toast.success("Payment successful! Enrolling you now...");
            setTimeout(() => {
              window.location.href = "/dashboard/courses?enrollment=success";
            }, 2000);
          },
          onError: (err) => {
            toast.error("Payment failed. Please try again.");
          }
        });
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <Button onClick={onSubmit} disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </>
      ) : (
        "Enroll Now!"
      )}
    </Button>
  );
}
