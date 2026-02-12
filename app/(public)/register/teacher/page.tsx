"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Users, 
  Award, 
  IndianRupee, 
  Globe, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles,
  Trophy,
  Rocket,
  ShieldCheck,
  X
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { getCurrencyConfig, formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket

export const dynamic = "force-dynamic";

// Benefits list will be localized inside the component - Author: Sanket

export default function TeacherRegisterPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  
  const userCountry = (session?.user as any)?.country || "India";
  const config = getCurrencyConfig(userCountry);
  const s = config.symbol;
  const rate = config.exchangeRate;

  const benefits = [
    {
      title: "High Earnings",
      description: `Earn up to ${s}${Math.round(4000 * rate)}/hour teaching what you love.`,
      icon: IndianRupee,
    },
    {
      title: "Global Reach",
      description: "Connect with students from across the globe.",
      icon: Globe,
    },
    {
      title: "Total Flexibility",
      description: "Set your own schedule and work from anywhere.",
      icon: Rocket,
    },
    {
      title: "Growth & Support",
      description: "Access professional tools and marketing help.",
      icon: Sparkles,
    },
  ];

  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("");
  const [formData, setFormData] = useState({
    bio: "",
    expertiseAreas: [] as string[],
    languages: [] as string[],
    hourlyRate: "",
  });
  const [metadata, setMetadata] = useState<{ expertise: { id: string, name: string }[], languages: { id: string, name: string }[] }>({ expertise: [], languages: [] });
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const { getMetadata } = await import("@/app/actions/metadata");
        const data = await getMetadata();
        setMetadata(data);
      } catch (error) {
        console.error("Failed to load metadata:", error);
        toast.error("Failed to load options. Please refresh the page.");
      } finally {
        setLoadingMetadata(false);
      }
    }
    loadMetadata();
  }, []);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/register");
    }
  }, [isPending, session, router]);

  const handleLanguageAddFromSelect = (value: string) => {
    if (value && !formData.languages.includes(value)) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, value]
      }));
      setSelectedLanguage("");
    }
  };

  const handleExpertiseAddFromSelect = (value: string) => {
    if (formData.expertiseAreas.length >= 5) {
      toast.error("Maximum 5 expertise areas allowed.");
      return;
    }
    if (value && !formData.expertiseAreas.includes(value)) {
      setFormData(prev => ({
        ...prev,
        expertiseAreas: [...prev.expertiseAreas, value]
      }));
      setSelectedExpertise("");
    }
  };

  const removeExpertise = (area: string) => {
    setFormData(prev => ({
      ...prev,
      expertiseAreas: prev.expertiseAreas.filter(e => e !== area)
    }));
  };

  const removeLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== lang)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missingFields = [];
    if (!formData.bio.trim()) missingFields.push("Bio");
    if (formData.expertiseAreas.length === 0) missingFields.push("Expertise Areas");
    if (formData.languages.length === 0) missingFields.push("Languages");
    if (!formData.hourlyRate) missingFields.push("Hourly Rate");

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/teacher/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio: formData.bio,
          expertise: formData.expertiseAreas,
          languages: formData.languages,
          hourlyRate: parseInt(formData.hourlyRate),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create teacher profile");
      }

      toast.success("Profile created! Redirecting...");
      window.location.href = "/teacher/verification";

    } catch (error) {
      console.error("Profile creation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create profile.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium animate-pulse">Initializing your journey...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left Wall - Hero Section */}
      <div className="hidden lg:flex flex-col relative bg-zinc-950 overflow-hidden">
        <Image
          src="/images/registration/teacher-hero.png"
          alt="Become a Teacher"
          fill
          className="object-cover opacity-60 mix-blend-luminosity grayscale hover:grayscale-0 transition-all duration-1000"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        <div className="relative z-10 p-12 flex flex-col h-full">
          <Link href="/" className="flex items-center gap-2 group w-fit">
            <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">Back to Home</span>
          </Link>

          <div className="mt-auto max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/20 hover:bg-primary/30 py-1 px-3">
                Teacher Partnership Program
              </Badge>
              <h1 className="text-5xl font-bold text-white tracking-tight mb-6 leading-[1.1]">
                Inspire the next generation of <span className="text-primary italic">global learners.</span>
              </h1>
              <p className="text-xl text-zinc-400 mb-12 leading-relaxed">
                Join our elite community of educators and transform how the world learns languages.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-8">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="mt-1 p-2 bg-primary/10 rounded-lg shrink-0">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-16 flex items-center gap-8 border-t border-white/10 pt-8">
              <div>
                <p className="text-2xl font-bold text-white">50K+</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Active Students</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-2xl font-bold text-white">{s}{Math.round(2000000 * rate)}+</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Teacher Earnings</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="size-8 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center text-[10px] text-white overflow-hidden ring-2 ring-zinc-950">
                    <Image src={`https://i.pravatar.cc/100?u=${i}`} alt="Avatar" width={32} height={32} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Wall - Registration Form */}
      <div className="flex flex-col bg-slate-50 dark:bg-zinc-950 overflow-y-auto">
        <div className="lg:hidden p-4 border-b bg-background sticky top-0 z-50">
           <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Exit Registration</span>
          </Link>
        </div>

        <div className="flex-1 px-6 py-12 lg:px-16 flex items-center justify-center">
          <div className="w-full max-w-xl">
            <div className="mb-10 lg:hidden">
              <h1 className="text-3xl font-bold mb-2">Become a Teacher</h1>
              <p className="text-muted-foreground">Join Kidokool and start teaching today.</p>
            </div>

            <Card className="border-0 shadow-2xl bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">
              <CardContent className="p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Complete Your Profile</h2>
                    <p className="text-sm text-muted-foreground">This information will be shown to potential students.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Bio Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bio" className="text-base font-semibold">Professional Bio</Label>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Required</span>
                    </div>
                    <Textarea
                      id="bio"
                      required
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Share your background, teaching philosophy, and what students can expect from your lessons..."
                      className="min-h-[140px] bg-slate-50/50 dark:bg-zinc-950/50 border-muted-foreground/10 focus-visible:ring-primary text-base leading-relaxed resize-none rounded-xl transition-all"
                    />
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent" />

                  {/* Expertise & Details */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Expertise Areas</Label>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Max 5</span>
                      </div>
                      <Select value={selectedExpertise} onValueChange={handleExpertiseAddFromSelect}>
                        <SelectTrigger className="bg-slate-50/50 dark:bg-zinc-950/50 border-muted-foreground/10 rounded-xl py-6 transition-all">
                          <SelectValue placeholder="Add an area" />
                        </SelectTrigger>
                        <SelectContent>
                          {metadata.expertise
                            .filter(e => !formData.expertiseAreas.includes(e.name))
                            .map((item) => (
                              <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2">
                        <AnimatePresence>
                          {formData.expertiseAreas.map((area) => (
                            <motion.div
                              key={area}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <Badge className="pl-3 pr-1 py-1.5 gap-1 bg-zinc-100 dark:bg-zinc-800 text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 border-0 rounded-lg group transition-all">
                                {area}
                                <button type="button" onClick={() => removeExpertise(area)} className="p-0.5 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-md transition-colors">
                                  <X className="w-3 h-3 text-muted-foreground" />
                                </button>
                              </Badge>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="hourlyRate" className="text-base font-semibold">Hourly Rate ({s})</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="hourlyRate"
                          type="number"
                          min={Math.round(100 * rate)}
                          required
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                          placeholder={Math.round(1000 * rate).toString()}
                          className="pl-10 h-14 bg-slate-50/50 dark:bg-zinc-950/50 border-muted-foreground/10 rounded-xl focus-visible:ring-primary transition-all pr-4 text-lg font-medium"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Avg: {s}{Math.round(500 * rate)} - {s}{Math.round(2500 * rate)} per hr</p>
                    </div>
                  </div>

                  {/* Languages Section */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Languages You Speak</Label>
                    <Select value={selectedLanguage} onValueChange={handleLanguageAddFromSelect}>
                      <SelectTrigger className="bg-slate-50/50 dark:bg-zinc-950/50 border-muted-foreground/10 rounded-xl py-6 transition-all">
                        <SelectValue placeholder="Select languages" />
                      </SelectTrigger>
                      <SelectContent>
                        {metadata.languages
                          .filter(l => !formData.languages.includes(l.name))
                          .map((lang) => (
                            <SelectItem key={lang.id} value={lang.name}>{lang.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2">
                       <AnimatePresence>
                        {formData.languages.map((lang) => (
                          <motion.div
                            key={lang}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <Badge variant="secondary" className="pl-3 pr-1 py-1.5 gap-1 bg-primary/10 text-primary border-0 rounded-lg group transition-all">
                              {lang}
                              <button type="button" onClick={() => removeLanguage(lang)} className="p-0.5 hover:bg-primary/20 rounded-md transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="pt-8 space-y-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing Application...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5" />
                          Apply for Teaching Position
                        </div>
                      )}
                    </Button>
                    <p className="text-center text-[10px] text-muted-foreground uppercase font-semibold tracking-wider opacity-60">
                      Response time: 24-48 hours • Professional Review
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                By applying, you agree to our <Link href="/terms" className="text-primary font-semibold hover:underline">Terms of Service</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}