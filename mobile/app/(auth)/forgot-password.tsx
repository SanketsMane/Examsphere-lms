import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Mail, ChevronLeft, ArrowRight } from "lucide-react-native";
import { authService } from "../../services/authService";
import { toast } from "sonner-native";
import { StatusBar } from "expo-status-bar";

/**
 * Forgot Password Screen
 * Sanket
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.forgetPassword(email);
      if (response.status === "success") {
        setIsSent(true);
        toast.success("Reset email sent!");
      } else {
        toast.error(response.message || "Failed to send reset email");
      }
    } catch (e) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-card border border-border rounded-xl items-center justify-center"
          >
            <ChevronLeft size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
              <Mail size={32} color="#4D9FFF" />
            </View>
            <Text className="text-foreground text-3xl font-bold text-center">Forgot Password?</Text>
            <Text className="text-muted-foreground text-center mt-2 px-4 text-base">
              {isSent 
                ? "Check your email for the reset link we just sent you." 
                : "No worries! Enter your email and we'll send you a link to reset your password."}
            </Text>
          </View>

          {!isSent ? (
            <View>
              <Text className="text-muted-foreground text-sm font-medium mb-2 ml-1">Email Address</Text>
              <View className="flex-row bg-card border border-border rounded-2xl px-4 items-center h-14">
                <Mail size={20} color="#64748b" />
                <TextInput
                  className="flex-1 text-foreground ml-3 text-base"
                  placeholder="name@example.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <TouchableOpacity 
                className="w-full bg-primary py-4 rounded-xl items-center mt-8 flex-row justify-center space-x-2 shadow-lg shadow-primary/30"
                onPress={handleReset}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-white text-lg font-bold">Send Reset Link</Text>
                    <ArrowRight size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              className="w-full bg-card border border-border py-4 rounded-xl items-center mt-4"
              onPress={() => router.back()}
            >
              <Text className="text-foreground font-bold">Back to Login</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
