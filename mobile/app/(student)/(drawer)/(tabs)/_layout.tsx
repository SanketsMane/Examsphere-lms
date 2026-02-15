import React from "react";
import { Tabs } from "expo-router";
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  User,
  LayoutGrid
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { BlurView } from "expo-blur";
import { View, Platform } from "react-native";

/**
 * Premium Tab Navigation
 * Sanket
 */
export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#020817" : "#ffffff",
          borderTopColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginBottom: Platform.OS === 'ios' ? 0 : 10,
          marginTop: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.5
        },
        tabBarIconStyle: {
          marginTop: 4
        }
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: "Learning",
          tabBarIcon: ({ color, size }) => <BookOpen size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: "Exams",
          tabBarIcon: ({ color, size }) => <GraduationCap size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

