import React, { useState, useRef } from "react";
import { 
  View, 
  Image, 
  Dimensions, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, { 
  FadeIn, 
  FadeInDown, 
  SlideInRight,
  useAnimatedStyle,
  interpolate,
  useSharedValue
} from "react-native-reanimated";
import { Typography, Button, GlassCard } from "../components/ui";
import { useOnboardingStore } from "../stores/onboardingStore";
import { cn } from "../utils/cn";

const { width, height } = Dimensions.get("window");

const ONBOARDING_DATA = [
  {
    id: "1",
    title: "Live Interactive Classes",
    description: "Learn in real-time with top industry experts. Ask questions, participate in polls, and solve problems together.",
    image: require("../assets/onboarding/live_classes.png"),
    color: "#3b82f6"
  },
  {
    id: "2",
    title: "1-1 Expert Mentorship",
    description: "Get personalized guidance for your career. Our mentors help you build a roadmap for your success.",
    image: require("../assets/onboarding/mentorship.png"),
    color: "#8b5cf6"
  },
  {
    id: "3",
    title: "Premium Courses",
    description: "Access high-quality, industry-relevant curriculum designed to make you job-ready from day one.",
    image: require("../assets/onboarding/courses.png"),
    color: "#10b981"
  },
  {
    id: "4",
    title: "Achieve Your Goals",
    description: "Join thousands of successful students who have transformed their careers with Kidokool LMS.",
    image: require("../assets/onboarding/success.png"),
    color: "#f59e0b"
  }
];

/**
 * Premium Onboarding Flow
 * Sanket
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
      router.replace("/(auth)/login");
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
    router.replace("/(auth)/login");
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <View style={{ width }} className="flex-1 items-center justify-center px-10">
        <Animated.View 
          entering={FadeIn.duration(1000).delay(200)}
          className="w-full aspect-square rounded-3xl overflow-hidden mb-12 shadow-2xl shadow-black/20"
        >
          <Image 
            source={item.image} 
            className="w-full h-full" 
            resizeMode="cover"
          />
        </Animated.View>
        
        <Animated.View entering={FadeInDown.duration(800).delay(400)} className="items-center">
          <Typography variant="h2" weight="bold" className="text-center mb-4">{item.title}</Typography>
          <Typography variant="p" className="text-center text-muted-foreground leading-6">
            {item.description}
          </Typography>
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      
      {/* Skip Button */}
      <View className="flex-row justify-end px-6 pt-2">
        <TouchableOpacity onPress={skipOnboarding}>
          <Typography variant="small" weight="bold" className="text-muted-foreground uppercase tracking-widest p-2">
            Skip
          </Typography>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      <View className="px-10 pb-12">
        {/* Pagination Dots */}
        <View className="flex-row justify-center mb-8 space-x-2">
          {ONBOARDING_DATA.map((_, index) => (
            <View 
              key={index}
              className={cn(
                "h-2 rounded-full",
                currentIndex === index ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
              )}
            />
          ))}
        </View>

        <Button 
          label={currentIndex === ONBOARDING_DATA.length - 1 ? "Get Started" : "Continue"}
          className="h-16 rounded-2xl"
          textClassName="text-lg font-bold"
          onPress={handleNext}
        />
      </View>
    </SafeAreaView>
  );
}
