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

export function NotificationSkeleton() {
  return (
    <View className="mb-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} className="flex-row p-4 rounded-3xl mb-4 border border-border bg-card">
          <SkeletonItem className="w-12 h-12 rounded-2xl mr-4" />
          <View className="flex-1 space-y-2">
             <View className="flex-row justify-between">
                <SkeletonItem className="h-4 w-32 rounded-md" />
                <SkeletonItem className="h-2 w-2 rounded-full" />
             </View>
             <SkeletonItem className="h-3 w-full rounded-md" />
             <SkeletonItem className="h-3 w-3/4 rounded-md" />
             <SkeletonItem className="h-2 w-20 rounded-md mt-1" />
          </View>
        </View>
      ))}
    </View>
  );
}
