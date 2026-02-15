import React, { useState } from "react";
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Switch,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight, Shield, Lock, Smartphone, KeyRound } from "lucide-react-native";
import { Typography, Button } from "../../../components/ui";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { toast } from "sonner-native";
import { cn } from "../../../utils/cn";

/**
 * Login & Security Screen
 * Password Change & 2FA Settings
 * Sanket
 */
export default function SecurityScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const handleChange = (key: string, value: string) => {
    setPasswords(prev => ({ ...prev, [key]: value }));
  };

  const handleUpdatePassword = async () => {
    const { current, new: newPass, confirm } = passwords;

    if (!current || !newPass || !confirm) {
      toast.error("Please fill all password fields");
      return;
    }

    if (newPass !== confirm) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPass.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);
      // Simulate API
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Password updated successfully");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error) {
      toast.error("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
  }: any) => (
    <View className="mb-5">
      <Typography weight="bold" className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">
        {label}
      </Typography>
      <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 h-14">
        <View className="mr-3">
          <KeyRound size={20} color={isDark ? "#94a3b8" : "#64748b"} />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? "#475569" : "#94a3b8"}
          className="flex-1 text-slate-900 dark:text-white text-base font-medium"
          secureTextEntry
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
        <Typography variant="h4" weight="bold" className="text-slate-900 dark:text-white">Login & Security</Typography>
        <View className="w-10" />
      </View>

      <ScrollView 
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl mb-8 border border-amber-100 dark:border-amber-500/20 flex-row items-center">
           <Shield size={24} color="#d97706" className="mr-4" />
           <Typography className="text-amber-700 dark:text-amber-400 text-sm flex-1 leading-5">
              Protect your account with a strong password and two-factor authentication.
           </Typography>
        </View>

        <Typography variant="h4" weight="bold" className="text-slate-900 dark:text-white mb-6">Change Password</Typography>

        <InputField 
          label="Current Password"
          value={passwords.current}
          onChangeText={(t: string) => handleChange("current", t)}
          placeholder="Enter current password"
        />

        <InputField 
          label="New Password"
          value={passwords.new}
          onChangeText={(t: string) => handleChange("new", t)}
          placeholder="Enter new password"
        />

        <InputField 
          label="Confirm New Password"
          value={passwords.confirm}
          onChangeText={(t: string) => handleChange("confirm", t)}
          placeholder="Retype new password"
        />

        <Button 
          onPress={handleUpdatePassword}
          label={loading ? "Updating..." : "Update Password"}
          variant="primary"
          className="mt-2 h-14 rounded-2xl shadow-lg shadow-blue-500/20"
          textClassName="font-bold"
          disabled={loading}
        />

        <View className="h-[1px] bg-slate-200 dark:bg-slate-800 my-10" />

        <Typography variant="h4" weight="bold" className="text-slate-900 dark:text-white mb-6">Two-Factor Authentication</Typography>

        <View className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex-row items-center justify-between mb-4">
           <View className="flex-row items-center flex-1 mr-4">
              <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3">
                 <Smartphone size={20} color={isDark ? "#94a3b8" : "#64748b"} />
              </View>
              <View className="flex-1">
                 <Typography weight="bold" className="text-slate-900 dark:text-white text-sm">Text Message (SMS)</Typography>
                 <Typography className="text-slate-500 text-xs mt-0.5" numberOfLines={1}>
                    Receive a code via SMS to verify login
                 </Typography>
              </View>
           </View>
           <Switch 
             value={twoFactorEnabled} 
             onValueChange={setTwoFactorEnabled}
             trackColor={{ false: "#e2e8f0", true: "#3b82f6" }}
             thumbColor={"#ffffff"}
           />
        </View>

        <View className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex-row items-center justify-between opacity-50">
           <View className="flex-row items-center flex-1 mr-4">
              <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3">
                 <Lock size={20} color={isDark ? "#94a3b8" : "#64748b"} />
              </View>
              <View className="flex-1">
                 <Typography weight="bold" className="text-slate-900 dark:text-white text-sm">Authenticator App</Typography>
                 <Typography className="text-slate-500 text-xs mt-0.5" numberOfLines={1}>
                    Use Google Authenticator etc.
                 </Typography>
              </View>
           </View>
           <Switch 
             value={false} 
             disabled
             trackColor={{ false: "#e2e8f0", true: "#3b82f6" }}
             thumbColor={"#ffffff"}
           />
        </View>
        <Typography className="text-center text-xs text-slate-400 mt-2">Coming soon</Typography>

      </ScrollView>
    </SafeAreaView>
  );
}
