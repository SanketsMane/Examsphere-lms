import React, { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Mail, Phone, Lock, User, ArrowRight, Fingerprint } from "lucide-react-native";
import { useAuthStore } from "../../stores/authStore";
import { useBioAuth } from "../../hooks/useBioAuth";
import { authService } from "../../services/authService";
import { toast } from "sonner-native";
import { Button, Input, Typography } from "../../components/ui";

/**
 * Premium Login / Signup Screen
 * Sanket
 */
export default function Login() {
  const router = useRouter(); // Standard hook call
  
  const setSession = useAuthStore((state: any) => state.setSession);
  const { authenticate } = useBioAuth();
  
  // Mode State
  const [isRegistering, setIsRegistering] = useState(false);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  
  // Flow State
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPhoneNumber("");
    setOtp("");
    setOtpSent(false);
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    resetForm();
  };

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    const success = await authenticate();
    if (success) {
      try {
        const response = await authService.getSession();
        if (response.status === "success" && response.data) {
           toast.success("Welcome back!");
           await setSession(response.data);
           router?.replace("/(student)");
        } else {
           toast.error("Session expired. Please log in with password.");
        }
      } catch (e) {
         toast.error("Biometric login failed.");
      }
    }
    setIsLoading(false);
  };

  const handleEmailAuth = async () => {
    if (!email || !password || (isRegistering && !name)) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = isRegistering 
        ? await authService.register(name, email, password)
        : await authService.login(email, password);

      if (response.status === "success" && response.data) {
        toast.success(isRegistering ? "Account created!" : "Welcome back!");
        await setSession(response.data);
        router?.replace("/(student)");
      } else {
        toast.error(response.message || "Authentication failed");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneAuth = async () => {
    if (!phoneNumber || (isRegistering && (!name || !email))) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    try {
      if (!otpSent) {
        const response = isRegistering 
          ? await authService.registerPhone(name, email, phoneNumber)
          : await authService.sendPhoneLoginOTP(phoneNumber);
        
        if (response.status === "success") {
          setOtpSent(true);
          toast.success("OTP Sent! Check your messages.");
        } else {
          toast.error(response.message || "Failed to send OTP");
        }
      } else {
        if (!otp) {
          toast.error("Please enter the verification code");
          return;
        }
        const response = isRegistering 
          ? await authService.verifyPhoneRegister(name, email, phoneNumber, otp)
          : await authService.verifyPhoneLogin(phoneNumber, otp);
        
        if (response.status === "success" && response.data) {
          toast.success("Welcome to Kidokool!");
          await setSession(response.data);
          router?.replace("/(student)");
        } else {
          toast.error(response.message || "Verification failed");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (authMethod === "email") {
      handleEmailAuth();
    } else {
      handlePhoneAuth();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View className="items-center mb-6 mt-4">
            <Image 
              source={require("../../assets/login_hero_3d.png")} 
              style={{ width: 260, height: 260 }}
              resizeMode="contain"
            />
            <View className="mt-4 items-center">
              <Typography variant="small" className="text-secondary font-bold uppercase tracking-widest mb-1">
                Kidokool LMS
              </Typography>
              <Typography variant="h1" className="text-center">
                {isRegistering ? "Create Account" : "Welcome Back"}
              </Typography>
              <Typography variant="p" className="text-center text-muted-foreground mt-2 px-4">
                {isRegistering ? "Start your learning journey today" : "Sign in to continue learning"}
              </Typography>
            </View>
          </View>

          {/* Auth Method Tabs */}
          <View className="flex-row bg-card border border-border rounded-2xl p-1 mb-8">
            <TouchableOpacity 
              className={cn(
                "flex-1 py-3 rounded-xl flex-row justify-center items-center space-x-2",
                authMethod === "email" ? "bg-primary shadow-sm" : "bg-transparent"
              )}
              onPress={() => { setAuthMethod("email"); resetForm(); }}
            >
              <Mail size={18} color={authMethod === "email" ? "#fff" : "#94a3b8"} />
              <Typography weight="semibold" className={authMethod === "email" ? "text-white ml-2" : "text-muted-foreground ml-2"}>
                Email
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity 
              className={cn(
                "flex-1 py-3 rounded-xl flex-row justify-center items-center space-x-2",
                authMethod === "phone" ? "bg-primary shadow-sm" : "bg-transparent"
              )}
              onPress={() => { setAuthMethod("phone"); resetForm(); }}
            >
              <Phone size={18} color={authMethod === "phone" ? "#fff" : "#94a3b8"} />
              <Typography weight="semibold" className={authMethod === "phone" ? "text-white ml-2" : "text-muted-foreground ml-2"}>
                Phone
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View>
            {isRegistering && (
              <Input
                label="Full Name"
                placeholder="John Doe"
                leftIcon={<User size={18} color="#94a3b8" />}
                value={name}
                onChangeText={setName}
              />
            )}

            {isRegistering && (
              <Input
                label="Email Address (Optional for Phone)"
                placeholder="email@example.com"
                leftIcon={<Mail size={18} color="#94a3b8" />}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            )}

            {authMethod === "email" && !isRegistering && (
              <Input
                label="Email Address"
                placeholder="email@example.com"
                leftIcon={<Mail size={18} color="#94a3b8" />}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            )}

            {authMethod === "email" && (
              <View>
                <View className="flex-row justify-between items-center mb-0">
                  {!isRegistering && (
                    <TouchableOpacity 
                      onPress={() => router.push("/(auth)/forgot-password")}
                      className="absolute right-1 top-1 z-10"
                    >
                      <Typography variant="small" className="text-primary font-bold">Forgot?</Typography>
                    </TouchableOpacity>
                  )}
                </View>
                <Input
                  label="Password"
                  placeholder="••••••••"
                  isPassword
                  leftIcon={<Lock size={18} color="#94a3b8" />}
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            )}

            {authMethod === "phone" && (
              <Input
                label="Phone Number"
                placeholder="+1234567890"
                keyboardType="phone-pad"
                leftIcon={<Phone size={18} color="#94a3b8" />}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                editable={!otpSent}
              />
            )}

            {authMethod === "phone" && otpSent && (
              <Input
                label="Verification Code"
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                leftIcon={<Lock size={18} color="#94a3b8" />}
                value={otp}
                onChangeText={setOtp}
                rightIcon={
                  <TouchableOpacity onPress={() => setOtpSent(false)}>
                    <Typography variant="small" className="text-primary font-bold">Resend</Typography>
                  </TouchableOpacity>
                }
              />
            )}

            <Button
              className="mt-4 shadow-xl shadow-primary/20"
              onPress={handleSubmit}
              loading={isLoading}
              label={authMethod === "phone" && !otpSent ? "Send OTP" : (isRegistering ? "Create Account" : "Sign In")}
              rightIcon={<ArrowRight size={20} color="#fff" />}
            />

            {!isRegistering && !otpSent && (
              <>
                <View className="flex-row items-center my-8">
                  <View className="flex-1 h-[1px] bg-border" />
                  <Typography variant="small" className="mx-4 font-bold uppercase text-muted-foreground/50">Or continue with</Typography>
                  <View className="flex-1 h-[1px] bg-border" />
                </View>

                <Button
                  variant="outline"
                  onPress={handleBiometricLogin}
                  disabled={isLoading}
                  leftIcon={<Fingerprint size={24} color="#3b82f6" />}
                  label="Biometric Login"
                />
              </>
            )}
          </View>

          <View className="flex-row justify-center mt-10 mb-6">
            <Typography variant="p" className="text-muted-foreground">
              {isRegistering ? "Already have an account? " : "Don't have an account? "}
            </Typography>
            <TouchableOpacity onPress={toggleMode}>
              <Typography weight="bold" className="text-primary">
                {isRegistering ? "Sign In" : "Sign Up"}
              </Typography>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Internal cn helper if not globally available, but we created it
import { cn } from "../../utils/cn";

