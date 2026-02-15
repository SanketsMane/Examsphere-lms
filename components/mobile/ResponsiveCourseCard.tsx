"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, 
  Clock, 
  Users, 
  PlayCircle, 
  BookOpen,
  Heart,
  Share2,
  MoreVertical,
  ShoppingCart
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { getCurrencyData, convertPrice } from "@/lib/currency";
import { useCurrency } from "@/components/providers/CurrencyProvider";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  duration: string;
  studentCount: number;
  level: string;
  category: string;
  instructor: {
    name: string;
    image?: string;
  };
  isEnrolled?: boolean;
  progress?: number;
  isFavorite?: boolean;
}

interface ResponsiveCourseCardProps {
  course: Course;
  variant?: "default" | "compact" | "horizontal";
  showActions?: boolean;
  country?: string | null;
  onEnroll?: (courseId: string) => void;
  onFavorite?: (courseId: string) => void;
  onShare?: (courseId: string) => void;
}

export function ResponsiveCourseCard({
  course,
  variant = "default",
  showActions = true,
  country,
  onEnroll,
  onFavorite,
  onShare
}: ResponsiveCourseCardProps) {
  const { formatPrice: formatPriceDynamic } = useCurrency();
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const displayPrice = (price: number) => {
    return formatPriceDynamic(price, country);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "h-3 w-3",
          i < Math.floor(rating) 
            ? "fill-yellow-400 text-yellow-400" 
            : "text-gray-300"
        )}
      />
    ));
  };

  // Compact variant for mobile lists
  if (variant === "compact") {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-all duration-200">
        <Link href={`/courses/${course.id}`}>
          <div className="flex gap-3 p-3">
            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
              {!imageError ? (
                <Image
                  src={course.thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop&crop=center`}
                  alt={course.title}
                  fill
                  className="object-cover"
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
              )}
              {course.isEnrolled && (
                <div className="absolute top-1 right-1">
                  <Badge variant="secondary" className="text-xs px-1 py-0.5">
                    Enrolled
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-2 mb-1">
                {course.title}
              </h3>
              
              <div className="flex items-center gap-1 mb-1">
                <div className="flex items-center">
                  {renderStars(course.rating)}
                </div>
                <span className="text-xs text-muted-foreground">
                  ({course.reviewCount})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {course.studentCount}
                  </span>
                </div>
                
                <div className="font-semibold text-sm">
                  {course.price === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    <span>{displayPrice(course.price)}</span>
                  )}
                </div>
              </div>

              {course.isEnrolled && course.progress !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {course.progress}% complete
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </Card>
    );
  }

  // Horizontal variant for mobile landscape
  if (variant === "horizontal") {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-all duration-200">
        <div className="flex gap-4 p-4">
          <div className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            {!imageError ? (
              <Image
                src={course.thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop&crop=center`}
                alt={course.title}
                fill
                className="object-cover"
                onLoad={() => setIsImageLoading(false)}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <Link href={`/courses/${course.id}`}>
                <h3 className="font-semibold text-base line-clamp-2 hover:text-blue-600 transition-colors">
                  {course.title}
                </h3>
              </Link>
              
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onFavorite?.(course.id)}>
                      <Heart className="h-4 w-4 mr-2" />
                      {course.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onShare?.(course.id)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={course.instructor.image} />
                <AvatarFallback className="text-xs">
                  {course.instructor.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {course.instructor.name}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1">
                {renderStars(course.rating)}
                <span className="text-sm text-muted-foreground ml-1">
                  {course.rating} ({course.reviewCount})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {course.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.studentCount}
                </span>
                <Badge variant="outline" className="text-xs">
                  {course.level}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right">
                  {course.originalPrice && course.originalPrice > course.price && (
                    <div className="text-xs text-muted-foreground line-through">
                      {displayPrice(course.originalPrice)}
                    </div>
                  )}
                  <div className="font-bold text-lg">
                    {course.price === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      displayPrice(course.price)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Default card variant
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative">
        <Link href={`/courses/${course.id}`}>
          <div className="relative aspect-video bg-gray-100 overflow-hidden">
            {!imageError ? (
              <Image
                src={course.thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop&crop=center`}
                alt={course.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onLoad={() => setIsImageLoading(false)}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
            )}
            
            {/* Overlay with play button */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <PlayCircle className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-2">
              <Badge className="text-xs">
                {course.category}
              </Badge>
              {course.isEnrolled && (
                <Badge variant="secondary" className="text-xs">
                  Enrolled
                </Badge>
              )}
            </div>

            {/* Quick actions */}
            {showActions && (
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 bg-white/90 hover:bg-white transition-colors",
                    course.isFavorite && "text-red-500"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    onFavorite?.(course.id);
                  }}
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    onShare?.(course.id);
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </Link>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title and description */}
          <div>
            <Link href={`/courses/${course.id}`}>
              <h3 className="font-semibold text-lg line-clamp-2 hover:text-blue-600 transition-colors mb-1">
                {course.title}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {course.description}
            </p>
          </div>

          {/* Instructor */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={course.instructor.image} />
              <AvatarFallback className="text-xs">
                {course.instructor.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {course.instructor.name}
            </span>
          </div>

          {/* Rating and stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {renderStars(course.rating)}
              <span className="text-sm text-muted-foreground ml-1">
                {course.rating} ({course.reviewCount})
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {course.duration}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {course.studentCount}
              </span>
            </div>
          </div>

          {/* Progress bar for enrolled courses */}
          {course.isEnrolled && course.progress !== undefined && (
            <div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${course.progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {course.progress}% complete
              </span>
            </div>
          )}

          {/* Price and action */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {course.originalPrice && course.originalPrice > course.price && (
                <div className="text-sm text-muted-foreground line-through">
                  {displayPrice(course.originalPrice)}
                </div>
              )}
              <div className="font-bold text-xl">
                {course.price === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  displayPrice(course.price)
                )}
              </div>
            </div>

            {!course.isEnrolled ? (
              <Button 
                onClick={() => onEnroll?.(course.id)}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Enroll
              </Button>
            ) : (
              <Button asChild>
                <Link href={`/courses/${course.id}`}>
                  Continue
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}