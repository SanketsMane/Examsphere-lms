"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { safeCallbackUrl } from "@/lib/callback-url";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { toast } from "sonner";

export default function VerifyRequestRoute() {
  return (
    <Suspense>
      <VerifyRequest />
    </Suspense>
  );
}

function VerifyRequest() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [emailPending, startTranstion] = useTransition();
  const params = useSearchParams();
  const email = params.get("email") as string;
  const callbackUrl = safeCallbackUrl(params.get("callbackUrl"));
  const isOtpCompleted = otp.length === 6;

  function verifyOtp() {
    startTranstion(async () => {
      const result = await authClient.signIn.emailOtp({
        email: email,
        otp: otp,
        fetchOptions: {
          onSuccess: async (ctx) => {
            toast.success("Email verified");
            // Get the user role from the response
            const role = ctx.data?.user?.role;

            // Redirect based on role
            if (role === "admin") {
              router.push("/admin");
            } else if (role === "teacher") {
              router.push("/teacher");
            } else {
              router.push(callbackUrl ?? "/dashboard");
            }
          },
          onError: () => {
            toast.error("Error verifying Email/OTP");
          },
        },
      });
    });
  }
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm mx-auto shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Please check your email</CardTitle>
          <CardDescription>
            We have sent a verification email code to your email address. Please
            open the email and paste the code below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <InputOTP
              value={otp}
              onChange={(value) => setOtp(value)}
              maxLength={6}
              className="gap-2"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          <Button
            onClick={verifyOtp}
            disabled={emailPending || !isOtpCompleted}
            className="w-full"
          >
            {emailPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              "Verify Account"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
