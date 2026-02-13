"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { TeacherProfileForm } from "@/components/teacher/teacher-profile-form";
import {
  MapPin,
  Clock,
  DollarSign,
  Star,
  Users,
  BookOpen,
  Globe,
  Edit,
  TrendingUp,
  Award,
  CheckCircle2,
  GraduationCap,
  Briefcase
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import { constructS3Url } from "@/lib/s3-helper";

export const dynamic = "force-dynamic";

interface TeacherProfile {
  id: string;
  userId: string;
  bio: string;
  expertise: string[];
  languages: string[];
  hourlyRate?: number;
  timezone?: string;
  qualifications?: string[];
  certifications?: string[];
  experience?: number;
  totalEarnings: number;
  avgRating: number | null;
  totalStudents: number;
  totalCourses: number;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/teacher/profile");
      const data = await response.json();

      if (response.ok) {
        setProfile(data.profile);
        setIsEditing(!data.profile); // Auto-open edit form if no profile exists
      } else {
        console.error("Error fetching profile:", data.error);
        setIsEditing(true); // Open edit form to create profile
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSave = (updatedProfile: TeacherProfile) => {
    setProfile(updatedProfile);
    setIsEditing(false);
    toast.success("Profile saved successfully!");
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (isEditing || !profile) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">Teacher Profile</h1>
            <p className="text-muted-foreground mt-1">
              {profile ? "Update your professional details" : "Create your teaching profile to get started"}
            </p>
          </div>
          {profile && (
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel Editing
            </Button>
          )}
        </div>

        <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <TeacherProfileForm
              existingProfile={profile || undefined}
              onSave={handleProfileSave}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2 px-1 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">Your Profile</h1>
          <p className="text-muted-foreground mt-1">Preview and manage your public teaching profile</p>
        </div>
        <Button onClick={() => setIsEditing(true)} className="shadow-md bg-blue-600 hover:bg-blue-700 text-white">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-sm border-t-4 border-t-green-500 hover:scale-[1.02] transition-transform">
          <CardContent className="flex items-center p-6">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${profile.totalEarnings.toLocaleString()}</p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Earnings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-yellow-500 hover:scale-[1.02] transition-transform">
          <CardContent className="flex items-center p-6">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-full mr-4">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {profile.avgRating ? profile.avgRating.toFixed(1) : "N/A"}
              </p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Average Rating</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-blue-500 hover:scale-[1.02] transition-transform">
          <CardContent className="flex items-center p-6">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile.totalStudents}</p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Students</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-purple-500 hover:scale-[1.02] transition-transform">
          <CardContent className="flex items-center p-6">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-full mr-4">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile.totalCourses}</p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Courses Created</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-700 relative"></div>
            <div className="px-8 pb-8 relative">
              <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 mb-6 gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800 shadow-lg">
                    <AvatarImage src={constructS3Url(profile.user?.image || "")} />
                    <AvatarFallback className="text-2xl font-bold bg-blue-100 text-blue-700">
                      {profile.user?.name?.charAt(0) || "T"}
                    </AvatarFallback>
                  </Avatar>
                  {profile.isVerified && (
                    <div className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 p-1 rounded-full">
                      <CheckCircle2 className="h-6 w-6 text-blue-500 fill-blue-100" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.user?.name}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {profile.user?.email}
                    {profile.isVerified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Verified Teacher</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-gray-500" />
                    About Me
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                    {profile.bio}
                  </p>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.expertise.map((area) => (
                        <Badge key={area} className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none px-3 py-1">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.languages.map((lang) => (
                        <Badge key={lang} variant="outline" className="px-3 py-1 border-gray-300">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {(profile.qualifications?.length ?? 0) > 0 && (
            <Card className="shadow-sm border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                  Qualifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3">
                  {profile.qualifications!.map((qual, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <div className="h-2 w-2 rounded-full bg-purple-400" />
                      {qual}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(profile.certifications?.length ?? 0) > 0 && (
            <Card className="shadow-sm border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3">
                  {profile.certifications!.map((cert, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <div className="h-2 w-2 rounded-full bg-blue-400" />
                      {cert}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Rate & Availability */}
          <Card className="shadow-md">
            <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b">
              <CardTitle className="text-lg">Teaching Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {profile.hourlyRate && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-blue-900/30 rounded-full text-blue-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium">Hourly Rate</span>
                  </div>
                  <span className="font-bold text-lg text-blue-700 dark:text-blue-300">
                    ${profile.hourlyRate}
                  </span>
                </div>
              )}
              {profile.experience !== undefined && (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-green-900/30 rounded-full text-green-600">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium">Experience</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {profile.experience} years
                  </span>
                </div>
              )}
              {profile.timezone && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-gray-700 rounded-full text-gray-600">
                      <Clock className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium">Timezone</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {profile.timezone}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card className="bg-gradient-to-br from-blue-400 to-red-600 text-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">Profile Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium">
                  <span>Profile Completion</span>
                  <span>{Math.round(calculateProfileCompletion(profile))}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
                  <div
                    className="bg-white h-3 rounded-full transition-all shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    style={{ width: `${calculateProfileCompletion(profile)}%` }}
                  />
                </div>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Complete your profile to attract more students and boost your visibility.
                </p>
                {Math.round(calculateProfileCompletion(profile)) < 100 && (
                  <Button variant="secondary" size="sm" className="w-full bg-white text-blue-600 hover:bg-blue-50" onClick={() => setIsEditing(true)}>
                    Complete Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function calculateProfileCompletion(profile: TeacherProfile): number {
  const fields = [
    profile.bio,
    profile.expertise?.length > 0,
    profile.languages?.length > 0,
    profile.hourlyRate,
    profile.timezone,
    (profile.qualifications?.length ?? 0) > 0,
    (profile.certifications?.length ?? 0) > 0,
  ];

  const completed = fields.filter(Boolean).length;
  return (completed / fields.length) * 100;
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
