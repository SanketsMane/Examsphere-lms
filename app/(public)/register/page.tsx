"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Loader2,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  Quote
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { setTeacherRole } from "@/app/actions/auth-actions";

export const dynamic = "force-dynamic";

const testimonials = [
  {
    quote: "EXAMSPHERE has completely transformed the way I learn. The courses are structured, easy to follow, and the instructors are world-class.",
    author: "Happy Student",
    role: "Full Stack Developer",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
  },
  {
    quote: "As a teacher, this platform gave me the tools to reach thousands of students globally. The analytics and support are unmatched.",
    author: "Verified Instructor",
    role: "Senior Math Instructor",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
  },
  {
    quote: "I landed my dream job after completing the Bootcamp here. The certificate actually carries weight in the industry.",
    author: "Recent Graduate",
    role: "Software Engineer",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80"
  }
];

export default function RegisterPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  if (session) {
    // Avoid redirect loop if already on dashboard or teacher page?
    // Actually register page should redirect if session exists.
  }

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
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
              return;
            }
          }
          toast.success("Account created successfully!");
          if (userType === "teacher") {
            // Redirect to teacher registration form to complete profile
            // Author: Sanket
            window.location.href = "/register/teacher";
          } else {
            router.push("/dashboard");
          }
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Something went wrong");
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <MotionWrapper className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Visuals */}
      <div className="hidden lg:flex flex-col relative bg-zinc-900 text-white p-12 justify-between overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
            alt="Background"
            fill
            sizes="50vw"
            className="object-cover opacity-40 mix-blend-overlay"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <span className="text-2xl font-bold tracking-tight">EXAMSPHERE</span>
          </Link>
          <div className="space-y-6 max-w-lg">
            <h1 className="text-4xl font-extrabold tracking-tight capitalize leading-tight">
              Start your <span className="text-primary">learning journey</span> with experts today.
            </h1>
            <div className="flex flex-col gap-3">
              {["Access 5000+ Premium Courses", "Learn at your own pace", "Get Certified & Hired"].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="font-medium text-zinc-200">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative z-10 w-full mb-10">
          <Carousel
            opts={{ loop: true }}
            plugins={[Autoplay({ delay: 5000 })]}
            className="w-full max-w-xl"
          >
            <CarouselContent>
              {testimonials.map((t, i) => (
                <CarouselItem key={i}>
                  <div className="p-6 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl">
                    <Quote className="w-8 h-8 text-primary mb-4 opacity-50" />
                    <p className="text-lg leading-relaxed font-medium mb-6">"{t.quote}"</p>
                    <div className="flex items-center gap-4">
                      <img src={t.avatar} alt={t.author} className="w-12 h-12 rounded-full object-cover border-2 border-primary/50" />
                      <div>
                        <h4 className="font-bold">{t.author}</h4>
                        <p className="text-sm text-zinc-400">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>

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
              onClick={() => setUserType("student")}
              className={`text-sm font-semibold py-2.5 rounded-lg transition-all duration-300 ${userType === "student" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              I'm a Student
            </button>
            <button
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
                <p className="font-semibold text-orange-800 dark:text-orange-200">Instructor Account</p>
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
                  placeholder="John"
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
                  placeholder="Doe"
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
                  type="email"
                  placeholder="john@example.com"
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
                  type="password"
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
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button variant="outline" type="button" className="w-full h-11 font-semibold" onClick={() => toast.info("Google Login")}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </MotionWrapper>
  );
}