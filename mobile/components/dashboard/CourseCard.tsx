import React from "react";
import { View, Image, TouchableOpacity } from "react-native";
import { Timer, Star, PlayCircle, Users } from "lucide-react-native";
import { Card, Typography, Badge, Button, GlassCard } from "../ui";
import { cn } from "../../utils/cn";

/**
 * Premium Course Card Component
 * Sanket
 */

interface CourseCardProps {
  title: string;
  category: string;
  price: string | number;
  duration: string | number;
  lessons: number;
  rating: number;
  reviews: number;
  instructor: string;
  image?: string;
  isEnrolled?: boolean;
  onPress?: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  title,
  category,
  price,
  duration,
  lessons,
  rating,
  reviews,
  instructor,
  image,
  isEnrolled,
  onPress,
}) => {
  return (
    <Card 
      onPress={onPress}
      className="p-0 border-0 shadow-xl shadow-black/5 mb-6 active:scale-[0.98]"
    >
      <View className="relative h-48 w-full bg-slate-900">
        {image ? (
          <Image 
            source={{ uri: image }} 
            className="flex-1 w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <PlayCircle size={48} color="#334155" />
          </View>
        )}
        <View className="absolute top-4 left-4">
          <Badge label={category} variant="secondary" className="bg-white/90" />
        </View>
        {!isEnrolled && (
          <View className="absolute bottom-4 left-4">
             <GlassCard intensity={30} className="px-3 py-1 border-0" innerClassName="p-0">
                <Typography weight="bold" className="text-white">₹{price}</Typography>
             </GlassCard>
          </View>
        )}
      </View>

      <View className="p-6">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Star size={14} color="#fbbf24" fill="#fbbf24" />
            <Typography variant="small" weight="bold" className="ml-1">{rating}</Typography>
            <Typography variant="small" className="ml-1 opacity-50">({reviews})</Typography>
          </View>
          {isEnrolled && <Badge label="Enrolled" variant="success" />}
        </View>

        <Typography variant="h4" numberOfLines={2} className="mb-4">
          {title}
        </Typography>

        <View className="flex-row items-center space-x-6 mb-6">
          <View className="flex-row items-center">
            <Timer size={16} color="#94a3b8" />
            <Typography variant="small" className="ml-1.5">{duration} mins</Typography>
          </View>
          <View className="flex-row items-center">
            <Users size={16} color="#94a3b8" />
            <Typography variant="small" className="ml-1.5">{lessons} Lessons</Typography>
          </View>
        </View>

        <View className="pt-5 border-t border-border flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-3">
              <Typography weight="bold" className="text-primary text-sm">{instructor.charAt(0)}</Typography>
            </View>
            <View>
              <Typography variant="small" weight="bold" numberOfLines={1}>{instructor}</Typography>
              <Typography variant="small" className="text-[10px] opacity-50">Instructor</Typography>
            </View>
          </View>
          <Button 
            variant={isEnrolled ? "secondary" : "primary"}
            size="sm"
            label={isEnrolled ? "Continue" : "Enroll Now"}
            className="rounded-xl px-6 h-10"
            onPress={onPress}
          />
        </View>
      </View>
    </Card>
  );
};
