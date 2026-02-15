import { View, Animated } from "react-native";
import { useEffect, useRef } from "react";

const SkeletonItem = ({ className, style }: { className?: string; style?: any }) => {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  return (
    <Animated.View 
      className={`bg-muted/40 rounded-lg ${className}`} 
      style={[style, { opacity }]} 
    />
  );
};

export function CourseSkeleton() {
  return (
    <View className="bg-card border border-border p-4 rounded-3xl mb-4">
      {/* Image Skeleton */}
      <SkeletonItem className="w-full h-40 rounded-2xl mb-4" />
      
      {/* Content Skeleton */}
      <View className="space-y-3">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-4">
            <SkeletonItem className="h-4 w-20 mb-2 rounded-full" />
            <SkeletonItem className="h-6 w-3/4 rounded-md" />
          </View>
          <SkeletonItem className="h-8 w-16 rounded-xl" />
        </View>

        <SkeletonItem className="h-4 w-1/2 rounded-md" />

        <View className="flex-row items-center justify-between pt-3 border-t border-border/50">
          <View className="flex-row space-x-3">
            <SkeletonItem className="h-4 w-12 rounded-full" />
            <SkeletonItem className="h-4 w-12 rounded-full" />
          </View>
          <SkeletonItem className="h-4 w-8 rounded-full" />
        </View>
      </View>
    </View>
  );
}
