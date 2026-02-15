import React, { useState } from "react";
import { 
  View, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Image,
  Switch,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  LogOut, 
  ChevronRight,
  BookMarked,
  CreditCard,
  MessageSquare,
  Menu,
  Camera,
  Wallet,
  Moon,
  Sun,
  HelpCircle
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../../../../stores/authStore";
import { useRouter, useNavigation } from "expo-router";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useColorScheme } from "nativewind";
import { Typography, Card, Button } from "../../../../components/ui";
import { cn } from "../../../../utils/cn";
import { studentService } from "../../../../services/studentService";
import { toast } from "sonner-native";

/**
 * Premium Profile & Account Screen
 * Redesigned with Image Upload & Dark Mode Support.
 * Sanket
 */
export default function ProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { user, logout, updateUser } = useAuthStore();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [uploading, setUploading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
          } 
        }
      ]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (uri: string) => {
    try {
      setUploading(true);
      // In a real app, we would upload to backend here.
      // For now, we'll simulate it or use the service if backend is ready.
      // const response = await studentService.updateProfileImage(uri);
      
      // Simulating successful local update for immediate UI feedback
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (user) {
        updateUser({ ...user, image: uri });
        toast.success("Profile updated successfully");
      }
      
    } catch (error) {
      toast.error("Failed to update profile picture");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const QuickAction = ({ icon: Icon, label, route, color }: any) => (
    <TouchableOpacity 
      onPress={() => route && router.push(route)}
      activeOpacity={0.8}
      className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-[24px] items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm min-h-[110px]"
    >
      <View className={cn("w-12 h-12 rounded-full items-center justify-center mb-4 shadow-sm", color)}>
        <Icon size={22} color="white" />
      </View>
      <Typography weight="bold" className="text-xs text-center text-slate-700 dark:text-slate-300 leading-tight">
        {label}
      </Typography>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#020817]" edges={['top']}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Settings & Menu */}
        <View className="px-6 pt-4 pb-8 flex-row items-center justify-between">
            <TouchableOpacity 
              onPress={() => navigation.openDrawer()}
              className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center shadow-sm active:scale-95"
            >
              <Menu size={20} color={isDark ? "#e2e8f0" : "#334155"} />
            </TouchableOpacity>
           <Typography variant="h3" weight="black" className="text-slate-900 dark:text-white text-2xl tracking-tight">Profile</Typography>
           <View className="w-12" /> 
        </View>

        {/* Profile Card */}
        <View className="px-6 mb-10">
          <View className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 items-center">
            
            {/* Avatar */}
            <View className="relative mb-6">
              <View className="w-28 h-28 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-slate-50 dark:border-slate-950 overflow-hidden items-center justify-center">
                {user?.image ? (
                  <Image source={{ uri: user.image }} className="w-full h-full" />
                ) : (
                  <Typography weight="bold" className="text-4xl text-slate-400">
                    {user?.name?.charAt(0) || "U"}
                  </Typography>
                )}
                {uploading && (
                  <View className="absolute inset-0 bg-black/40 items-center justify-center">
                    <ActivityIndicator color="white" />
                  </View>
                )}
              </View>
              <TouchableOpacity 
                onPress={pickImage}
                activeOpacity={0.8}
                className="absolute bottom-0 right-0 bg-primary w-10 h-10 rounded-full items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm"
              >
                <Camera size={16} color="white" />
              </TouchableOpacity>
            </View>

            <Typography variant="h3" weight="bold" className="text-slate-900 dark:text-white text-center text-2xl">
              {user?.name || "Student Name"}
            </Typography>
            <Typography className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2 mb-6">
              {user?.email || "student@example.com"}
            </Typography>

            <View className="flex-row items-center px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-full border border-indigo-100 dark:border-indigo-500/20">
               <View className="w-2 h-2 rounded-full bg-indigo-500 mr-2.5" />
               <Typography className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                 {user?.role || "Student Account"}
               </Typography>
            </View>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View className="px-6 flex-row mb-10 gap-4">
          <QuickAction 
            icon={BookMarked} 
            label="Certificates" 
            route="/(student)/(drawer)/certificates" 
            color="bg-blue-500" 
          />
          <QuickAction 
            icon={Wallet} 
            label="Wallet" 
            route="/(student)/(drawer)/wallet" 
            color="bg-emerald-500" 
          />
          <QuickAction 
            icon={Bell} 
            label="Alerts" 
            route="/(student)/(drawer)/notifications" 
            color="bg-amber-500" 
          />
        </View>

        {/* Settings List */}
        <View className="px-6">
          <Typography weight="black" className="text-slate-400 text-xs uppercase tracking-[0.2em] mb-6 ml-4">
            Settings
          </Typography>
          
          <View className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm mb-10">
            <ListItem 
              icon={User} 
              label="Personal Information" 
              color="#3b82f6" 
              onPress={() => router.push("/(student)/settings/personal-info")} 
            />
            <ListItem 
              icon={Shield} 
              label="Login & Security" 
              color="#8b5cf6" 
              onPress={() => router.push("/(student)/settings/security")} 
            />
            <ListItem 
              icon={CreditCard} 
              label="Payment Methods" 
              color="#10b981" 
              isLast 
              onPress={() => router.push("/(student)/settings/payments")} 
            />
          </View>

          <Typography weight="black" className="text-slate-400 text-xs uppercase tracking-[0.2em] mb-6 ml-4">
            App Preferences
          </Typography>

          <View className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm mb-12">
            <View className="flex-row items-center p-5 border-b border-slate-100 dark:border-slate-800/50">
              <View className="w-11 h-11 rounded-2xl bg-orange-50 dark:bg-orange-500/10 items-center justify-center mr-5">
                 {isDark ? <Moon size={22} color="#f97316" /> : <Sun size={22} color="#f97316" />}
              </View>
              <Typography weight="semibold" className="flex-1 text-slate-900 dark:text-white text-[15px]">Dark Mode</Typography>
              <Switch 
                value={isDark} 
                onValueChange={toggleColorScheme} 
                trackColor={{ false: "#e2e8f0", true: "#3b82f6" }}
                thumbColor={"#ffffff"}
              />
            </View>
            <ListItem 
              icon={Bell} 
              label="Push Notifications" 
              color="#ec4899" 
              isLast 
              onPress={() => router.push("/(student)/settings/notifications")} 
            />
          </View>

          <TouchableOpacity 
             onPress={handleLogout}
             activeOpacity={0.8}
             className="flex-row items-center justify-center bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-2xl mb-8"
          >
             <LogOut size={20} color="#ef4444" />
             <Typography weight="bold" className="text-red-500 ml-3">Sign Out</Typography>
          </TouchableOpacity>
          
          <Typography className="text-center text-xs text-slate-300 dark:text-slate-700 pb-8">
            Version 1.0.0 • Build 2024
          </Typography>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ListItem = ({ icon: Icon, label, color, isLast, onPress }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    activeOpacity={0.7}
    className={cn(
      "flex-row items-center p-5 active:bg-slate-50 dark:active:bg-slate-800/50",
      !isLast && "border-b border-slate-100 dark:border-slate-800/50"
    )}
  >
    <View className={cn("w-11 h-11 rounded-2xl items-center justify-center mr-5 bg-opacity-10")} style={{ backgroundColor: `${color}15` }}>
      <Icon size={22} color={color} />
    </View>
    <Typography weight="semibold" className="flex-1 text-slate-900 dark:text-white text-[15px]">
      {label}
    </Typography>
    <ChevronRight size={20} color="#94a3b8" />
  </TouchableOpacity>
);
