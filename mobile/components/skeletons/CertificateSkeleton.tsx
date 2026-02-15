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

export function CertificateSkeleton() {
  return (
    <View className="space-y-6">
      {[1, 2].map((i) => (
        <View key={i} className="bg-card border border-border p-5 rounded-3xl overflow-hidden">
          <View className="flex-row items-start justify-between mb-4">
            <SkeletonItem className="w-12 h-12 rounded-2xl" />
            <View className="flex-row space-x-2">
               <SkeletonItem className="w-10 h-10 rounded-xl" />
               <SkeletonItem className="w-10 h-10 rounded-xl" />
            </View>
          </View>
          
          <SkeletonItem className="h-6 w-3/4 rounded-md mb-2" />
          <SkeletonItem className="h-4 w-1/2 rounded-md mb-4" />
          
          <View className="border-t border-border/50 mt-2 pt-4 flex-row justify-between items-center">
             <SkeletonItem className="h-3 w-24 rounded-full" />
             <SkeletonItem className="h-3 w-16 rounded-full" />
          </View>
        </View>
      ))}
    </View>
  );
}
