"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Mail,
  Lock,
  User,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { currentCallbackUrl, withCallbackUrl } from "@/lib/callback-url";
import { toast } from "sonner";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { AuthHeroPanel } from "@/components/marketing/examsphere/AuthHeroPanel";
import { setTeacherRole } from "@/app/actions/auth-actions";

export default function RegisterPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  // Set while a signup is in flight so this redirect doesn't race the post-signup navigation
  // (it used to send new teachers to the student dashboard before their profile step).
  const signingUp = useRef(false);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  useEffect(() => setCallbackUrl(currentCallbackUrl()), []);

  useEffect(() => {
    if (session && !signingUp.current) {
      router.push(currentCallbackUrl() ?? "/dashboard");
    }
  }, [session, router]);
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<"student" | "teacher">("student");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    signingUp.current = true;

    try {
      await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`,
        image: undefined,
        callbackURL: userType === "teacher" ? "/teacher" : "/dashboard",
      }, {
        onSuccess: async () => {
          if (userType === "teacher") {
            try {
              await setTeacherRole();
            } catch (err) {
              console.error("Failed to set teacher role", err);
              toast.error("Failed to set account permissions");
              signingUp.current = false;
              setIsLoading(false);
              return;
            }
          }
          toast.success("Account created successfully!");
          if (userType === "teacher") {
            // Redirect to teacher registration form to complete profile
            // Author: Sanket
            window.location.href = "/register/teacher";
          } else {
            router.push(callbackUrl ?? "/dashboard");
          }
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Something went wrong");
          signingUp.current = false;
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
      signingUp.current = false;
      setIsLoading(false);
    }
  };

  return (
    <MotionWrapper className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Visuals */}
      <AuthHeroPanel
        heading={<>Your journey to <span className="text-orange-500">success</span> begins here.</>}
      />

      {/* Right Side - Form */}
      <div className="flex flex-col items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
            <p className="text-muted-foreground mt-2">Enter your details to get started.</p>
          </div>

          {/* Role Switcher */}
          <div className="grid grid-cols-2 p-1 bg-secondary/50 rounded-xl relative">
            <button
              type="button"
              onClick={() => setUserType("student")}
              className={`text-sm font-semibold py-2.5 rounded-lg transition-all duration-300 ${userType === "student" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              I'm a Student
            </button>
            <button
              type="button"
              onClick={() => setUserType("teacher")}
              className={`text-sm font-semibold py-2.5 rounded-lg transition-all duration-300 ${userType === "teacher" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              I'm a Teacher
            </button>
          </div>

          {userType === "teacher" && (
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-800 p-4 rounded-lg flex gap-3 items-start">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-full text-orange-600 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-orange-800 dark:text-orange-200">Teacher Account</p>
                <p className="text-orange-600 dark:text-orange-300 mt-1">You'll be redirected to complete your profile after signup.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="given-name"
                  autoComplete="given-name"
                  placeholder="First name"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-secondary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="family-name"
                  autoComplete="family-name"
                  placeholder="Last name"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-secondary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="off"
                  placeholder="Enter your email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 bg-secondary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 bg-secondary/20"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Create Account"}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By creating an account you agree to our{" "}
              <Link href="/terms" className="font-semibold text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href={withCallbackUrl("/login", callbackUrl)} className="font-bold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </MotionWrapper>
  );
}