import React, { useState } from "react";
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight, User, Mail, Phone, MapPin, FileText, Save } from "lucide-react-native";
import { useAuthStore } from "../../../stores/authStore";
import { studentService } from "../../../services/studentService";
import { Typography, Button } from "../../../components/ui";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { toast } from "sonner-native";
import { cn } from "../../../utils/cn";

/**
 * Personal Information Screen
 * Premium Edit Profile Form
 * Sanket
 */
export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "", // Assuming phone exists on User type, if not we'll handle it
    bio: user?.bio || "",
    address: user?.address || "", // Assuming address exists
  });

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setLoading(true);
      // Simulate API call delay if backend isn't fully ready, or call actual service
      // const response = await studentService.updateProfile(formData);
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Smooth UX

      if (user) {
        const updatedUser = { ...user, ...formData };
        await updateUser(updatedUser);
        toast.success("Profile updated successfully");
        router.back();
      }
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ 
    label, 
    value, 
    onChangeText, 
    icon: Icon, 
    placeholder, 
    multiline = false,
    readOnly = false,
    keyboardType = "default" as any
  }: any) => (
    <View className="mb-6">
      <Typography weight="bold" className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">
        {label}
      </Typography>
      <View className={cn(
        "flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4",
        multiline ? "items-start py-3" : "h-14",
        readOnly && "opacity-60 bg-slate-50 dark:bg-slate-900/50"
      )}>
        <View className={cn("mr-3", multiline && "mt-1")}>
          <Icon size={20} color={isDark ? "#94a3b8" : "#64748b"} />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? "#475569" : "#94a3b8"}
          className={cn(
            "flex-1 text-slate-900 dark:text-white text-base font-medium",
            multiline && "h-24 text-top leading-6"
          )}
          multiline={multiline}
          editable={!readOnly}
          textAlignVertical={multiline ? "top" : "center"}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#020817]" edges={['top']}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-6">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center shadow-sm active:scale-95"
        >
          <ChevronRight size={20} color={isDark ? "#e2e8f0" : "#334155"} className="rotate-180" />
        </TouchableOpacity>
        <Typography variant="h4" weight="bold" className="text-slate-900 dark:text-white">Personal Info</Typography>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl mb-8 border border-blue-100 dark:border-blue-500/20">
            <Typography className="text-blue-600 dark:text-blue-400 text-sm text-center">
              Keep your personal details up to date to ensure your account is secure.
            </Typography>
          </View>

          <InputField 
            label="Full Name"
            value={formData.name}
            onChangeText={(t: string) => handleChange("name", t)}
            icon={User}
            placeholder="Enter your full name"
          />

          <InputField 
            label="Email Address"
            value={formData.email}
            onChangeText={(t: string) => handleChange("email", t)}
            icon={Mail}
            placeholder="your@email.com"
            readOnly
          />

          <InputField 
            label="Phone Number"
            value={formData.phone}
            onChangeText={(t: string) => handleChange("phone", t)}
            icon={Phone}
            placeholder="+1 234 567 890"
            keyboardType="phone-pad"
          />

          <InputField 
            label="Address"
            value={formData.address}
            onChangeText={(t: string) => handleChange("address", t)}
            icon={MapPin}
            placeholder="City, Country"
            multiline
          />

          <InputField 
            label="Bio"
            value={formData.bio}
            onChangeText={(t: string) => handleChange("bio", t)}
            icon={FileText}
            placeholder="Tell us a little about yourself..."
            multiline
          />

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Action */}
      <View className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <Button 
          onPress={handleSave}
          label={loading ? "Saving Changes..." : "Save Changes"}
          variant="primary"
          className="h-14 rounded-2xl shadow-lg shadow-blue-500/30"
          textClassName="text-base font-bold"
          icon={!loading && <Save size={20} color="white" />}
          disabled={loading}
        />
      </View>
    </SafeAreaView>
  );
}
