import React from "react";
import { Text, TextProps } from "react-native";
import { cn } from "../../utils/cn";

interface TypographyProps extends TextProps {
  variant?: "h1" | "h2" | "h3" | "h4" | "p" | "small" | "large" | "lead" | "muted";
  weight?: "normal" | "medium" | "semibold" | "bold" | "black";
}

export const Typography = ({ 
  children, 
  variant = "p", 
  weight, 
  className, 
  ...props 
}: TypographyProps) => {
  const getVariantClass = () => {
    switch (variant) {
      case "h1": return "text-4xl font-bold tracking-tight text-foreground";
      case "h2": return "text-3xl font-semibold tracking-tight text-foreground";
      case "h3": return "text-2xl font-semibold tracking-tight text-foreground";
      case "h4": return "text-xl font-semibold tracking-tight text-foreground";
      case "large": return "text-lg font-semibold text-foreground";
      case "p": return "text-base leading-7 text-foreground";
      case "lead": return "text-xl text-muted-foreground";
      case "muted": return "text-sm text-muted-foreground";
      case "small": return "text-xs font-medium leading-none text-muted-foreground";
      default: return "";
    }
  };

  const getWeightClass = () => {
    switch (weight) {
      case "normal": return "font-normal";
      case "medium": return "font-medium text-foreground/90";
      case "semibold": return "font-semibold text-foreground";
      case "bold": return "font-bold text-foreground";
      case "black": return "font-black text-foreground";
      default: return "";
    }
  };

  return (
    <Text 
      className={cn(getVariantClass(), getWeightClass(), className)} 
      {...props}
    >
      {children}
    </Text>
  );
};
