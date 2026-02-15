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

export function ExamSkeleton() {
  return (
    <View className="bg-card border border-border p-5 rounded-2xl flex-row items-center mb-4">
      {/* Icon/Date Box */}
      <SkeletonItem className="w-12 h-12 rounded-xl mr-4" />
      
      {/* Content */}
      <View className="flex-1 space-y-2">
         <SkeletonItem className="h-5 w-3/4 rounded-md" />
         <SkeletonItem className="h-4 w-1/2 rounded-md" />
      </View>
    </View>
  );
}
