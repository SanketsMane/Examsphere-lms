import React, { useState } from "react";
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { 
  ChevronLeft, 
  Check, 
  Zap, 
  Crown, 
  Star,
  ShieldCheck,
  HelpCircle
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { subscriptionService } from "../../../services/subscriptionService";
import { Typography, Card, Badge, GlassCard, Button } from "../../../components/ui";
import { cn } from "../../../utils/cn";

const { width } = Dimensions.get("window");

/**
 * High-Conversion Subscription Plans Screen
 * Sanket
 */
export default function SubscriptionScreen() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("month");

  const { data: plansResponse, isLoading, refetch } = useQuery({
    queryKey: ["subscriptionPlans"],
    queryFn: () => subscriptionService.getPlans(),
  });

  const plans = (plansResponse as any)?.data || [];
  const filteredPlans = plans.filter((p: any) => p.interval === billingCycle);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-4 mb-6">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-12 h-12 bg-card border border-border rounded-2xl items-center justify-center shadow-sm active:scale-95"
        >
          <ChevronLeft size={20} color="#94a3b8" />
        </TouchableOpacity>
        <Typography variant="h4" weight="bold">Premium Plans</Typography>
        <TouchableOpacity className="w-12 h-12 items-center justify-center">
           <HelpCircle size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3b82f6" />
        }
      >
        <View className="px-6 items-center">
          <Typography variant="h2" className="text-center mb-2">Upgrade your learning</Typography>
          <Typography variant="p" className="text-center text-muted-foreground px-10 mb-8">
            Level up your language journey with Kidokool Premium features and mentors.
          </Typography>

          {/* Billing Toggle */}
          <View className="flex-row bg-card border border-border p-1.5 rounded-2xl mb-12">
             <TouchableOpacity 
               onPress={() => setBillingCycle("month")}
               className={cn(
                 "px-8 py-2.5 rounded-xl",
                 billingCycle === "month" ? "bg-primary shadow-lg shadow-primary/30" : "bg-transparent"
               )}
             >
                <Typography weight="bold" className={billingCycle === "month" ? "text-white" : "text-muted-foreground"}>Monthly</Typography>
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={() => setBillingCycle("year")}
               className={cn(
                 "px-8 py-2.5 rounded-xl relative",
                 billingCycle === "year" ? "bg-primary shadow-lg shadow-primary/30" : "bg-transparent"
               )}
             >
                <Typography weight="bold" className={billingCycle === "year" ? "text-white" : "text-muted-foreground"}>Yearly</Typography>
                <View className="absolute -top-3 -right-6 bg-emerald-500 px-2 py-0.5 rounded-full border-2 border-background">
                   <Typography weight="bold" className="text-white text-[9px]">SAVE 20%</Typography>
                </View>
             </TouchableOpacity>
          </View>

          {/* Pricing Cards */}
          {isLoading ? (
             <View className="py-20">
                <ActivityIndicator size="large" color="#3b82f6" />
             </View>
          ) : (
            filteredPlans.map((plan: any, index: number) => (
              <Card 
                key={plan.id}
                className={cn(
                  "mb-8 w-full border-2 overflow-hidden",
                  plan.name.toLowerCase().includes("pro") || plan.name.toLowerCase().includes("premium") 
                    ? "border-primary bg-primary/5" 
                    : "border-border bg-card"
                )}
                innerClassName="p-0"
              >
                {/* Popular Badge */}
                {(index === 1 || plan.isDefault) && (
                   <View className="bg-primary py-1.5 items-center">
                      <Typography variant="small" weight="bold" className="text-white uppercase tracking-widest text-[10px]">Most Popular Choice</Typography>
                   </View>
                )}
                
                <View className="p-8">
                  <View className="flex-row justify-between items-center mb-4">
                    <Typography variant="h3" weight="bold">{plan.name}</Typography>
                    {plan.name.toLowerCase().includes("pro") ? (
                       <Crown size={24} color="#3b82f6" />
                    ) : (
                       <Zap size={24} color="#3b82f6" />
                    )}
                  </View>
                  
                  <Typography variant="p" className="text-muted-foreground mb-8 text-sm">{plan.description || "Unlock advanced learning tools and personal mentorship."}</Typography>
                  
                  <View className="flex-row items-end mb-10">
                    <Typography className="text-4xl mb-1 mr-1" weight="bold">$</Typography>
                    <Typography className="text-6xl" weight="bold">{plan.price}</Typography>
                    <Typography className="text-muted-foreground mb-2 ml-2" weight="bold">/ {plan.interval}</Typography>
                  </View>

                  <View className="space-y-4 mb-10">
                    {(plan.features || []).map((feature: string, i: number) => (
                      <View key={i} className="flex-row items-center">
                        <View className="w-5 h-5 bg-emerald-500/20 rounded-full items-center justify-center mr-4">
                           <Check size={12} color="#10B981" />
                        </View>
                        <Typography variant="p" className="text-[15px] opacity-90">{feature}</Typography>
                      </View>
                    ))}
                  </View>

                  <Button 
                    variant={plan.name.toLowerCase().includes("pro") ? "primary" : "outline"}
                    className={cn(
                       "h-14 rounded-2xl",
                       plan.name.toLowerCase().includes("pro") ? "shadow-xl shadow-primary/40" : "border-primary"
                    )}
                    textClassName={plan.name.toLowerCase().includes("pro") ? "text-white" : "text-primary"}
                    label={plan.price === 0 ? "Get Started for Free" : "Upgrade to " + plan.name}
                    onPress={() => {}}
                  />
                </View>
              </Card>
            ))
          )}

          {/* Trust Badges */}
          <View className="flex-row items-center justify-center space-x-8 mt-4 opacity-50">
             <View className="items-center">
                <ShieldCheck size={20} color="#94A3B8" />
                <Typography variant="small" className="mt-2" weight="bold">Secure</Typography>
             </View>
             <View className="items-center">
                <Star size={20} color="#94A3B8" />
                <Typography variant="small" className="mt-2" weight="bold">Top Rated</Typography>
             </View>
             <View className="items-center">
                <Zap size={20} color="#94A3B8" />
                <Typography variant="small" className="mt-2" weight="bold">Instant</Typography>
             </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
