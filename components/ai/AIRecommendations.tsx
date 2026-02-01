"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveCourseCard } from "@/components/mobile/ResponsiveCourseCard";
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Brain, 
  Target,
  RefreshCw,
  Eye,
  ThumbsUp,
  Clock,
  Star,
  BookOpen,
  PlayCircle
} from "lucide-react";
import { CourseRecommendation } from "@/lib/recommendation-engine";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

interface RecommendationSectionProps {
  userId: string;
  currentCourseId?: string;
  compact?: boolean;
  maxItems?: number;
}

interface RecommendationResponse {
  personalized: CourseRecommendation[];
  trending: CourseRecommendation[];
  similar: CourseRecommendation[];
  learningPaths: any[];
}

export function AIRecommendations({ 
  userId, 
  currentCourseId, 
  compact = false, 
  maxItems = 6 
}: RecommendationSectionProps) {
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("personalized");

  useEffect(() => {
    loadRecommendations();
  }, [userId, currentCourseId]);

  const loadRecommendations = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(`/api/recommendations?userId=${userId}&currentCourse=${currentCourseId || ''}&limit=${maxItems}`);
      if (!response.ok) throw new Error('Failed to load recommendations');

      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCourseInteraction = async (courseId: string, type: 'view' | 'like' | 'share') => {
    try {
      await fetch('/api/recommendations/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type,
          courseId,
          timestamp: new Date().toISOString()
        })
      });

      // Update recommendation metadata
      if (type === 'view') {
        setRecommendations(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            personalized: prev.personalized.map(rec => 
              rec.courseId === courseId 
                ? { ...rec, viewed: true }
                : rec
            )
          };
        });
      }
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  if (loading) {
    return <RecommendationsSkeleton compact={compact} />;
  }

  if (!recommendations) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Brain className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No recommendations available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const RecommendationGrid = ({ courses, title, icon: Icon, subtitle }: {
    courses: CourseRecommendation[];
    title: string;
    icon: any;
    subtitle?: string;
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => loadRecommendations(true)}
          disabled={refreshing}
          className="text-blue-600 hover:text-blue-700"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-6">
            <p className="text-muted-foreground text-sm">No courses found</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="w-full">
          <div className={`flex gap-4 pb-4 ${compact ? 'w-max' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {courses.map((course) => (
              <div key={course.courseId} className={compact ? 'w-80 flex-shrink-0' : ''}>
                <RecommendationCard
                  course={course}
                  onInteraction={handleCourseInteraction}
                  compact={compact}
                />
              </div>
            ))}
          </div>
          {compact && <ScrollBar orientation="horizontal" />}
        </ScrollArea>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-6">
        <RecommendationGrid
          courses={recommendations.personalized.slice(0, maxItems)}
          title="Recommended for You"
          icon={Sparkles}
          subtitle="AI-powered personalized recommendations"
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
            <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              AI Course Recommendations
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Smart
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Personalized course suggestions powered by AI
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="personalized" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              For You ({recommendations.personalized.length})
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending ({recommendations.trending.length})
            </TabsTrigger>
            {currentCourseId && (
              <TabsTrigger value="similar" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Similar ({recommendations.similar.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="personalized">
            <RecommendationGrid
              courses={recommendations.personalized}
              title="Personalized Recommendations"
              icon={Sparkles}
              subtitle="Based on your learning history and preferences"
            />
          </TabsContent>

          <TabsContent value="trending">
            <RecommendationGrid
              courses={recommendations.trending}
              title="Trending Courses"
              icon={TrendingUp}
              subtitle="Popular courses with high enrollment and ratings"
            />
          </TabsContent>

          {currentCourseId && (
            <TabsContent value="similar">
              <RecommendationGrid
                courses={recommendations.similar}
                title="Similar Courses"
                icon={Target}
                subtitle="Courses related to your current learning path"
              />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ 
  course, 
  onInteraction, 
  compact 
}: {
  course: CourseRecommendation;
  onInteraction: (courseId: string, type: 'view' | 'like' | 'share') => void;
  compact?: boolean;
}) {
  const [liked, setLiked] = useState(false);

  const handleView = () => {
    onInteraction(course.courseId, 'view');
  };

  const handleLike = () => {
    setLiked(!liked);
    onInteraction(course.courseId, 'like');
    toast.success(liked ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleShare = () => {
    onInteraction(course.courseId, 'share');
    navigator.clipboard.writeText(`${window.location.origin}/courses/${course.courseId}`);
    toast.success('Course link copied to clipboard');
  };

  const { data: session } = authClient.useSession();
  const user = session?.user as any;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 relative overflow-hidden">
      {/* Confidence indicator */}
      <div className="absolute top-2 right-2 z-10">
        <Badge 
          variant={course.confidence >= 80 ? "default" : "secondary"}
          className="text-xs"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          {Math.round(course.confidence)}%
        </Badge>
      </div>

      {/* Course content */}
      <div onClick={handleView} className="cursor-pointer">
        <ResponsiveCourseCard
          course={{
            id: course.courseId,
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail,
            price: course.price,
            rating: course.rating,
            reviewCount: 0, // Would need to fetch this
            duration: course.duration,
            studentCount: 0, // Would need to fetch this
            level: course.difficulty,
            category: course.category,
            instructor: course.instructor,
            isFavorite: liked
          }}
          country={user?.country}
          variant={compact ? "compact" : "default"}
          onEnroll={(courseId) => {
            // Handle enrollment
            window.location.href = `/courses/${courseId}`;
          }}
          onFavorite={handleLike}
          onShare={handleShare}
        />
      </div>

      {/* Recommendation reasons */}
      {course.reasons.length > 0 && (
        <div className="p-3 border-t bg-muted/20">
          <div className="flex items-start gap-2">
            <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                Why this course?
              </p>
              <div className="flex flex-wrap gap-1">
                {course.reasons.slice(0, 2).map((reason, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tags */}
      {course.tags.length > 0 && (
        <div className="p-2 pt-0">
          <div className="flex flex-wrap gap-1">
            {course.tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function RecommendationsSkeleton({ compact }: { compact?: boolean }) {
  const skeletonCount = compact ? 3 : 6;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-video w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}