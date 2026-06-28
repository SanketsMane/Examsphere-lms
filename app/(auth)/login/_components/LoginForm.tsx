"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Github,
  CheckCircle,
  GraduationCap
} from "lucide-react";

const stats = [
  { icon: BookOpen, label: "Courses", value: "1000+" },
  { icon: Users, label: "Students", value: "50K+" },
  { icon: Award, label: "Instructors", value: "500+" },
  { icon: TrendingUp, label: "Success Rate", value: "95%" }
];

const features = [
  "Access to all premium courses",
  "Learn from industry experts",
  "Get certificates upon completion",
  "Join vibrant learning community"
];

export function LoginForm() {
  const router = useRouter();
  const [githubPending, startGithubTransition] = useTransition();
  const [emailPending, startEmailTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<"student" | "teacher">("student");

  async function signInWithGithub() {
    startGithubTransition(async () => {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed in with Github, redirecting...");
          },
          onError: () => {
            toast.error("Internal Server Error");
          },
        },
      });
    });
  }

  function signInWithEmail() {
    startEmailTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "sign-in",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Email sent! Check your inbox.");
            router.push(`/verify-request?email=${email}`);
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Error sending email");
          },
        },
      });
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Side - Login Form */}
          <div className="order-1">
            <Card className="shadow-2xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 md:p-8">
                <div className="text-center space-y-2">
                  <CardTitle className="text-3xl font-bold">Welcome Back!</CardTitle>
                  <CardDescription className="text-blue-100 text-base">
                    {userType === "student"
                      ? "Login to continue your learning journey"
                      : "Login to manage your courses and students"}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="p-6 md:p-8 space-y-6">
                {/* User Type Toggle */}
                <div className="grid grid-cols-2 gap-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
                  <button
                    onClick={() => setUserType("student")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${userType === "student"
                      ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                      }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    Student
                  </button>
                  <button
                    onClick={() => setUserType("teacher")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${userType === "teacher"
                      ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                      }`}
                  >
                    <Users className="w-4 h-4" />
                    Teacher
                  </button>
                </div>

                {/* Social Login */}
                <Button
                  variant="outline"
                  type="button"
                  disabled={githubPending}
                  onClick={signInWithGithub}
                  className="w-full h-12 text-sm font-medium border-2 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                >
                  {githubPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Github className="mr-2 h-4 w-4" />
                  )}
                  Sign in with GitHub
                </Button>

                <div className="relative">
                  <Separator />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-white dark:bg-card px-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Or continue with email
                    </span>
                  </div>
                </div>

                {/* Email Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10 h-12 border-blue-100 focus-visible:ring-blue-500"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            signInWithEmail();
                          }
                        }}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={signInWithEmail}
                    disabled={emailPending || !email}
                    className="w-full h-12 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    {emailPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Link...
                      </>
                    ) : (
                      <>
                        Continue with Email
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Footer Links */}
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link
                      href={userType === 'student' ? "/register" : "/register/teacher"}
                      className="font-medium hover:underline text-blue-600"
                    >
                      {userType === 'student' ? "Register as Student" : "Register as Teacher"}
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Marketing */}
          <div className="order-2 space-y-8">
            <div className="text-center lg:text-left">
              <Badge variant="outline" className="mb-4 border-blue-200 text-blue-700 bg-blue-50">
                Trusted by 50,000+ Learners
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
                Master New Skills with
                <span className="block mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Expert Mentors
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Unlock your potential with our global learning community.
                Access premium courses and get certified today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <Card key={index} className="p-6 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 transition-colors bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm group">
                    <IconComponent className="h-8 w-8 mx-auto mb-3 text-blue-600 group-hover:scale-110 transition-transform" />
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </Card>
                );
              })}
            </div>

            {/* Features List */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                Why join EXAMSPHERE?
              </h3>
              <div className="grid gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
