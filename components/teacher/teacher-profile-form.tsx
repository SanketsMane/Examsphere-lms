"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { teacherProfileSchema, languages } from "@/lib/zodSchemas";

type TeacherProfileFormData = z.infer<typeof teacherProfileSchema>;

interface TeacherProfile extends TeacherProfileFormData {
  id: string;
  userId: string;
  totalEarnings: number;
  avgRating: number | null;
  totalStudents: number;
  totalCourses: number;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  isApproved: boolean;
  user?: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface TeacherProfileFormProps {
  existingProfile?: TeacherProfile;
  onSave?: (profile: TeacherProfile) => void;
}

const expertiseAreas = [
  "Programming", "Web Development", "Mobile Development", "Data Science", "Machine Learning", "AI",
  "DevOps", "Cloud Computing", "Cybersecurity", "Blockchain", "Game Development", "UI/UX Design",
  "Digital Marketing", "Business", "Finance", "Mathematics", "Physics", "Chemistry", "Biology",
  "English", "Languages", "Music", "Art", "Photography", "Writing", "Psychology", "Philosophy",
  "History", "Economics", "Engineering", "Architecture", "Medicine", "Law", "Education", "Other"
];

const timezones = [
  "UTC", "EST", "CST", "MST", "PST", "GMT", "CET", "IST", "JST", "AEST", "Other"
];

export function TeacherProfileForm({ existingProfile, onSave }: TeacherProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [qualificationInput, setQualificationInput] = useState("");
  const [certificationInput, setCertificationInput] = useState("");

  const form = useForm<TeacherProfileFormData>({
    resolver: zodResolver(teacherProfileSchema),
    defaultValues: {
      bio: existingProfile?.bio || "",
      expertise: existingProfile?.expertise || [],
      languages: existingProfile?.languages || [],
      hourlyRate: existingProfile?.hourlyRate || undefined,
      experience: existingProfile?.experience || undefined,
      timezone: existingProfile?.timezone || "",
      qualifications: existingProfile?.qualifications || [],
      certifications: existingProfile?.certifications || [],
    },
  });

  const watchedExpertise = form.watch("expertise");
  const watchedLanguages = form.watch("languages");
  const watchedQualifications = form.watch("qualifications");
  const watchedCertifications = form.watch("certifications");

  const addExpertise = () => {
    if (expertiseInput.trim() && !watchedExpertise.includes(expertiseInput.trim())) {
      form.setValue("expertise", [...watchedExpertise, expertiseInput.trim()]);
      setExpertiseInput("");
    }
  };

  const removeExpertise = (item: string) => {
    form.setValue("expertise", watchedExpertise.filter(e => e !== item));
  };

  const addLanguage = () => {
    if (languageInput && !watchedLanguages.includes(languageInput)) {
      form.setValue("languages", [...watchedLanguages, languageInput]);
      setLanguageInput("");
    }
  };

  const removeLanguage = (item: string) => {
    form.setValue("languages", watchedLanguages.filter(l => l !== item));
  };

  const addQualification = () => {
    if (qualificationInput.trim() && !watchedQualifications?.includes(qualificationInput.trim())) {
      form.setValue("qualifications", [...(watchedQualifications || []), qualificationInput.trim()]);
      setQualificationInput("");
    }
  };

  const removeQualification = (item: string) => {
    form.setValue("qualifications", watchedQualifications?.filter(q => q !== item) || []);
  };

  const addCertification = () => {
    if (certificationInput.trim() && !watchedCertifications?.includes(certificationInput.trim())) {
      form.setValue("certifications", [...(watchedCertifications || []), certificationInput.trim()]);
      setCertificationInput("");
    }
  };

  const removeCertification = (item: string) => {
    form.setValue("certifications", watchedCertifications?.filter(c => c !== item) || []);
  };

  const onSubmit = async (data: TeacherProfileFormData) => {
    setIsLoading(true);
    try {
      const method = existingProfile ? "PUT" : "POST";
      const response = await fetch("/api/teacher/profile", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save profile");
      }

      toast.success(existingProfile ? "Profile updated successfully!" : "Profile created successfully!");

      if (onSave && result.profile) {
        onSave(result.profile);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Teacher Profile</CardTitle>
        <CardDescription>
          Complete your profile to start teaching and attracting students
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Bio Section */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell students about yourself, your background, and teaching style..."
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    Share your teaching philosophy, experience, and what makes you unique as an educator.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expertise Section */}
            <FormItem>
              <FormLabel>Areas of Expertise</FormLabel>
              <div className="space-y-2">
                <div className="flex flex-col md:flex-row gap-2">
                   {/* Quick Select */}
                  <Select onValueChange={(val) => {
                      if (val && !watchedExpertise.includes(val)) {
                           form.setValue("expertise", [...watchedExpertise, val]);
                           toast.success(`Added ${val}`);
                      }
                  }}>
                    <SelectTrigger className="w-full md:w-[240px]">
                      <SelectValue placeholder="Select popular topic..." />
                    </SelectTrigger>
                    <SelectContent>
                      {expertiseAreas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Custom Input */}
                  <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Or type any custom expertise..."
                        value={expertiseInput}
                        onChange={(e) => setExpertiseInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addExpertise())}
                        disabled={watchedExpertise.length >= 10}
                      />
                      <Button 
                        type="button" 
                        onClick={addExpertise} 
                        size="icon" 
                        variant="outline"
                        disabled={watchedExpertise.length >= 10}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                    {watchedExpertise.length}/10 selected
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {watchedExpertise.map((item) => (
                    <Badge key={item} variant="secondary" className="text-sm">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeExpertise(item)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <FormMessage />
            </FormItem>

            {/* Languages Section */}
            <FormItem>
              <FormLabel>Languages You Teach In</FormLabel>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select value={languageInput} onValueChange={setLanguageInput}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addLanguage} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {watchedLanguages.map((lang) => (
                    <Badge key={lang} variant="secondary" className="text-sm">
                      {lang}
                      <button
                        type="button"
                        onClick={() => removeLanguage(lang)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <FormMessage />
            </FormItem>

            {/* Hourly Rate & Timezone & Experience */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate (INR)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="2500"
                        min="5"
                        step="0.01"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>For 1-on-1 sessions</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience (Years)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="5"
                        min="0"
                        step="1"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>Teaching Experience</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Qualifications */}
            <FormItem>
              <FormLabel>Qualifications</FormLabel>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={qualificationInput}
                    onChange={(e) => setQualificationInput(e.target.value)}
                    placeholder="e.g., PhD in Computer Science, MIT"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addQualification())}
                  />
                  <Button type="button" onClick={addQualification} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {watchedQualifications?.map((qual) => (
                    <Badge key={qual} variant="secondary" className="text-sm">
                      {qual}
                      <button
                        type="button"
                        onClick={() => removeQualification(qual)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </FormItem>

            {/* Certifications */}
            <FormItem>
              <FormLabel>Certifications</FormLabel>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={certificationInput}
                    onChange={(e) => setCertificationInput(e.target.value)}
                    placeholder="e.g., AWS Certified Solutions Architect"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCertification())}
                  />
                  <Button type="button" onClick={addCertification} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {watchedCertifications?.map((cert) => (
                    <Badge key={cert} variant="secondary" className="text-sm">
                      {cert}
                      <button
                        type="button"
                        onClick={() => removeCertification(cert)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </FormItem>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {existingProfile ? "Update Profile" : "Create Profile"}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}