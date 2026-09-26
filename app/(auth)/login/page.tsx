"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Lock
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { currentCallbackUrl, withCallbackUrl } from "@/lib/callback-url";
import { toast } from "sonner";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { AuthHeroPanel } from "@/components/marketing/examsphere/AuthHeroPanel";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // e.g. set by an Enroll button so the student lands back on the courses page after login.
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  useEffect(() => setCallbackUrl(currentCallbackUrl()), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (loginMethod === "password") {
        // Password-based login - Author: Sanket
        await authClient.signIn.email({
          email: email,
          password: password,
        }, {
          onSuccess: () => {
            toast.dismiss(); // Dismiss any loading toasts if present
            toast.success("Login successful! Redirecting...");
            router.push(callbackUrl ?? "/dashboard");
          },
          onError: (ctx) => {
            console.error("Login Error:", ctx);
            let message = ctx.error.message;
            
            // Improve user feedback for common auth errors
            if (ctx.error.status === 401 || message?.toLowerCase().includes("invalid")) {
              message = "Invalid email or password. Please try again.";
            } else if (!message) {
               message = "Unable to sign in. Please try again later.";
            }
            
            toast.error(message);
            setIsLoading(false);
          }
        });
      } else {
        // OTP-based login - Author: Sanket
        await authClient.emailOtp.sendVerificationOtp({
          email: email,
          type: "sign-in",
        }, {
          onSuccess: () => {
             toast.dismiss();
            toast.success("Verification code sent! Check your inbox.");
            router.push(
              `/verify-request?email=${encodeURIComponent(email)}` +
                (callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : "")
            );
          },
          onError: (ctx) => {
             console.error("OTP Error:", ctx);
             let message = ctx.error.message || "Failed to send verification code.";
             if (ctx.error.status === 429) {
                 message = "Too many attempts. Please try again later.";
             }
            toast.error(message);
            setIsLoading(false);
          }
        });
      }
    } catch (error: any) {
      console.error("Unexpected submission error:", error);
      // Fallback for unexpected errors that might slip through
      const failureMsg = error?.message || "An unexpected error occurred. Please try again.";
      toast.error(failureMsg);
      setIsLoading(false);
    }
  };

  return (
    <MotionWrapper className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Visuals */}
      <AuthHeroPanel
        heading={<>Welcome back to your <span className="text-orange-500">learning journey</span>.</>}
      />

      {/* Right Side - Form */}
      <div className="flex flex-col items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground mt-2">
              {loginMethod === "password"
                ? "Enter your email and password to login."
                : "Enter your email to receive a login code."}
            </p>
          </div>

          {/* Login Method Toggle - Author: Sanket */}
          <div className="grid grid-cols-2 p-1 bg-secondary/50 rounded-xl relative">
            <button
              type="button"
              onClick={() => setLoginMethod("password")}
              className={`text-sm font-semibold py-2.5 rounded-lg transition-all duration-300 ${loginMethod === "password" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod("otp")}
              className={`text-sm font-semibold py-2.5 rounded-lg transition-all duration-300 ${loginMethod === "otp" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              OTP Code
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="off"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-secondary/20 h-11"
                />
              </div>
            </div>

            {/* Password Field - Author: Sanket */}
            {loginMethod === "password" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-secondary/20 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-11 font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : loginMethod === "password" ? "Login" : "Continue with Email"}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>



          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href={withCallbackUrl("/register", callbackUrl)} className="font-bold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </MotionWrapper >
  );
}
