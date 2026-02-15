import React from "react";
import { 
  View, 
  TouchableOpacity, 
  ViewProps,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { cn } from "../../utils/cn";

interface CardProps extends ViewProps {
  onPress?: () => void;
  className?: string;
  innerClassName?: string;
  animate?: boolean;
}

/**
 * Premium Atomic Card
 * Sanket
 */
export const Card = ({ 
  children, 
  onPress, 
  className, 
  innerClassName,
  animate = true,
  ...props 
}: CardProps) => {
  const Container = (onPress ? TouchableOpacity : View) as any;
  const containerProps = onPress ? { activeOpacity: 0.9 } : {};

  const content = (
    <Container
      className={cn(
        "bg-card border border-border rounded-3xl shadow-sm overflow-hidden",
        className
      )}
      onPress={onPress}
      {...containerProps}
      {...(props as any)}
    >
      <View className={cn("p-6", innerClassName)}>
        {children}
      </View>
    </Container>
  );

  if (animate) {
    return (
      <Animated.View entering={FadeInUp.duration(600).delay(100)}>
        {content}
      </Animated.View>
    );
  }

  return content;
};
