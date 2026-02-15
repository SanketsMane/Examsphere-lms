import React from "react";
import { 
  View, 
  TouchableOpacity, 
  ViewProps, 
  StyleSheet 
} from "react-native";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import Animated, { FadeIn } from "react-native-reanimated";
import { cn } from "../../utils/cn";

interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: "light" | "dark" | "default";
  onPress?: () => void;
  className?: string;
  innerClassName?: string;
  animate?: boolean;
}

/**
 * Premium Glassmorphism Card
 * Sanket
 */
export const GlassCard = ({
  children,
  intensity = 30,
  tint,
  onPress,
  className,
  innerClassName,
  animate = true,
  ...props
}: GlassCardProps) => {
  const { colorScheme } = useColorScheme();
  const Container = (onPress ? TouchableOpacity : View) as any;
  const containerProps = onPress ? { activeOpacity: 0.8 } : {};

  const defaultTint = colorScheme === "dark" ? "dark" : "light";

  const content = (
    <Container
      className={cn(
        "rounded-3xl border border-white/20 overflow-hidden",
        className
      )}
      onPress={onPress}
      {...containerProps}
      {...(props as any)}
    >
      <BlurView
        intensity={intensity}
        tint={tint || defaultTint}
        className={cn("p-6", innerClassName)}
      >
        {children}
      </BlurView>
    </Container>
  );

  if (animate) {
    return (
      <Animated.View entering={FadeIn.duration(800)}>
        {content}
      </Animated.View>
    );
  }

  return (
    <View
      className={cn(
        "rounded-3xl overflow-hidden border border-white/20 dark:border-white/10",
        className
      )}
      {...props}
    >
      {content}
    </View>
  );
};
