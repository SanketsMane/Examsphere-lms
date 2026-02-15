import React from "react";
import { View, Text } from "react-native";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "../../utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 border text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/20 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive/20 text-destructive",
        outline: "text-foreground border-border",
        success: "border-transparent bg-green-500/20 text-green-500",
        warning: "border-transparent bg-yellow-500/20 text-yellow-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.ComponentPropsWithoutRef<typeof View>,
    VariantProps<typeof badgeVariants> {
      label: string;
      textClassName?: string;
    }

function Badge({ className, variant, label, textClassName, ...props }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      <Text className={cn("text-[10px] uppercase tracking-wider font-bold", 
        variant === 'default' && "text-primary",
        variant === 'secondary' && "text-secondary-foreground",
        variant === 'destructive' && "text-destructive",
        variant === 'outline' && "text-foreground",
        variant === 'success' && "text-green-600",
        variant === 'warning' && "text-yellow-600",
        textClassName
      )}>
        {label}
      </Text>
    </View>
  );
}

export { Badge, badgeVariants };
