import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { toast } from "sonner-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  User, 
  Mail, 
  MapPin, 
  GraduationCap, 
  Type,
  Check
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { userService } from "../../services/userService";
import { useAuthStore } from "../../stores/authStore";

/**
 * Personal Information Screen
 * Sanket
 */
export default function PersonalInformation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state: any) => state.setUser);
  
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    gender: "",
    country: "",
    education: "",
  });

  // Fetch Current Profile
  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => userService.getProfile(),
  });

  useEffect(() => {
    if (profileResponse?.data) {
      const p = profileResponse.data;
      setFormData({
        name: p.name || "",
        bio: p.bio || "",
        gender: p.gender || "",
        country: p.country || "",
        education: p.education || "",
      });
    }
  }, [profileResponse]);

  // Update Profile Mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => userService.updateProfile(data),
    onSuccess: (res) => {
      if (res.status === "success") {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        // Update local auth store with new name if changed
        setUser(res.data);
        toast.success("Profile updated successfully!");
        router.back();
      } else {
        toast.error(res.message || "Failed to update profile.");
      }
    }
  });

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    updateMutation.mutate(formData);
  };

  const renderInput = (label: string, value: string, icon: any, key: string, multiline = false) => (
    <View className="mb-6">
      <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2 ml-1">{label}</Text>
      <View className={`flex-row items-center bg-card border border-border rounded-2xl px-4 ${multiline ? 'items-start py-4' : 'h-14'}`}>
        <View className="mr-3 mt-0.5">
          {icon}
        </View>
        <TextInput 
          className={`flex-1 text-foreground text-sm ${multiline ? 'h-24 pt-0' : ''}`}
          value={value}
          onChangeText={(text) => setFormData(prev => ({ ...prev, [key]: text }))}
          placeholder={`Enter your ${label.toLowerCase()}`}
          placeholderTextColor="#64748b"
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
        />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#4D9FFF" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-muted rounded-xl items-center justify-center"
          >
            <ChevronLeft size={20} color="#94a3b8" />
          </TouchableOpacity>
          <Text className="text-foreground text-lg font-bold">Personal Info</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={updateMutation.isPending}
            className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center"
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color="#4D9FFF" />
            ) : (
              <Check size={20} color="#4D9FFF" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
          <View className="items-center mb-8">
             <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center border-2 border-primary/20">
                <Text className="text-primary text-4xl font-bold">{formData.name?.charAt(0) || "U"}</Text>
             </View>
             <TouchableOpacity className="mt-4">
                <Text className="text-primary text-xs font-bold uppercase tracking-wider">Change Photo</Text>
             </TouchableOpacity>
          </View>

          {renderInput("Full Name", formData.name, <User size={18} color="#94a3b8" />, "name")}
          
          <View className="mb-6">
            <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2 ml-1">Email (ReadOnly)</Text>
            <View className="flex-row items-center bg-muted border border-border rounded-2xl px-4 h-14 opacity-60">
              <Mail size={18} color="#94a3b8" className="mr-3" />
              <Text className="text-muted-foreground text-sm ml-3">{profileResponse?.data?.email}</Text>
            </View>
          </View>

          {renderInput("Bio", formData.bio, <Type size={18} color="#94a3b8" />, "bio", true)}
          {renderInput("Country", formData.country, <MapPin size={18} color="#94a3b8" />, "country")}
          {renderInput("Education", formData.education, <GraduationCap size={18} color="#94a3b8" />, "education")}

          <View className="h-20" />
        </ScrollView>

        {/* Save Button Floating */}
        <View className="p-6 bg-background border-t border-border">
          <TouchableOpacity 
            onPress={handleSave}
            disabled={updateMutation.isPending}
            className="bg-primary py-4 rounded-2xl items-center justify-center shadow-lg shadow-primary/30"
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
