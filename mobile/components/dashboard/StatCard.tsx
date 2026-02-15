import React from "react";
import { View } from "react-native";
import { GlassCard, Typography } from "../ui";
import { cn } from "../../utils/cn";

/**
 * Premium Stat Card Component
 * Sanket
 */

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  trendType?: "up" | "down";
  onPress?: () => void;
  variant?: "primary" | "secondary" | "success" | "warning";
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  icon, 
  trend, 
  trendType = "up", 
  onPress,
  variant = "primary"
}) => {
  return (
    <GlassCard 
      className="mb-4 overflow-hidden" 
      innerClassName="p-5" 
      onPress={onPress}
      intensity={15}
    >
      {/* Decorative Glow */}
      <View className={cn(
        "absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20",
        variant === "primary" ? "bg-primary" : 
        variant === "success" ? "bg-emerald-500" :
        variant === "warning" ? "bg-amber-500" : "bg-slate-500"
      )} />

      <View className="flex-row items-center justify-between mb-3">
        <Typography variant="small" weight="bold" className="text-muted-foreground uppercase tracking-widest text-[10px]">
          {label}
        </Typography>
        <View className={cn(
          "w-8 h-8 rounded-lg items-center justify-center",
          variant === "primary" ? "bg-primary/10" : 
          variant === "success" ? "bg-emerald-500/10" :
          variant === "warning" ? "bg-amber-500/10" : "bg-slate-500/10"
        )}>
          {icon}
        </View>
      </View>
      
      <View className="flex-row items-baseline">
        <Typography variant="h2" weight="bold">
          {value}
        </Typography>
        {trend ? (
          <View className={cn(
            "flex-row items-center ml-3 px-2 py-0.5 rounded-full",
            trendType === "up" ? "bg-emerald-500/10" : "bg-red-500/10"
          )}>
            <Typography 
              variant="small" 
              weight="bold" 
              className={cn(
                "text-[10px]",
                trendType === "up" ? "text-emerald-500" : "text-red-500"
              )}
            >
              {trendType === "up" ? "↑" : "↓"} {trend}
            </Typography>
          </View>
        ) : null}
      </View>
    </GlassCard>
  );
};
