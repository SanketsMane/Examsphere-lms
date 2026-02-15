import React from "react";
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  View, 
  TouchableOpacityProps 
} from "react-native";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "../../utils/cn"; 

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-xl px-4 py-3 active:opacity-80",
  {
    variants: {
      variant: {
        primary: "bg-primary",
        secondary: "bg-secondary",
        outline: "border border-border bg-card",
        ghost: "bg-transparent",
        destructive: "bg-destructive",
      },
      size: {
        default: "h-14",
        sm: "h-10 px-3",
        lg: "h-16 px-8",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

const buttonTextVariants = cva(
  "font-bold text-base",
  {
    variants: {
      variant: {
        primary: "text-primary-foreground",
        secondary: "text-secondary-foreground",
        outline: "text-foreground",
        ghost: "text-primary",
        destructive: "text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

interface ButtonProps extends TouchableOpacityProps, VariantProps<typeof buttonVariants> {
  label?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  textClassName?: string;
}

export const Button = React.forwardRef<View, ButtonProps>(
  ({ className, variant, size, label, loading, icon, leftIcon, rightIcon, children, textClassName, ...props }, ref) => {
    return (
      <TouchableOpacity
        ref={ref}
        disabled={loading || props.disabled}
        className={cn(buttonVariants({ variant, size, className }), (loading || props.disabled) && "opacity-50")}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={variant === "outline" || variant === "ghost" ? "#3b82f6" : "white"} />
        ) : (
          <View className="flex-row items-center justify-center">
            {icon && <View className="mr-2">{icon}</View>}
            {leftIcon && <View className="mr-2">{leftIcon}</View>}
            {label ? (
              <Text className={cn(buttonTextVariants({ variant, className: textClassName }))}>
                {label}
              </Text>
            ) : children}
            {rightIcon && <View className="ml-2">{rightIcon}</View>}
          </View>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = "Button";
