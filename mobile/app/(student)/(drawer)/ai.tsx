import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Keyboard
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { 
  ChevronLeft, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  RefreshCw,
  MoreVertical
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { aiService, AiMessage } from "../../../services/aiService";
import { Typography, Card, GlassCard } from "../../../components/ui";
import { cn } from "../../../utils/cn";

/**
 * Premium AI Tutor Chat Interface
 * Sanket
 */
export default function AIScreen() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>([
    { role: "assistant", content: "Hi! I'm your Kidokool AI Tutor. How can I help you with your learning today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AiMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const response = await aiService.sendMessage(newMessages);
      if (response.status === "success" && response.data) {
        setMessages(prev => [...prev, response.data as AiMessage]);
      }
    } catch (error) {
       console.error("AI Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isLoading]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-4 border-b border-border/50">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 bg-card border border-border rounded-xl items-center justify-center mr-4"
          >
            <ChevronLeft size={20} color="#94a3b8" />
          </TouchableOpacity>
          <View className="flex-row items-center">
             <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center border border-primary/20">
                <Bot size={22} color="#3b82f6" />
             </View>
             <View className="ml-3">
                <Typography variant="large" weight="bold">AI Tutor</Typography>
                <View className="flex-row items-center">
                   <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                   <Typography variant="small" className="text-emerald-500 text-[10px]" weight="bold">ONLINE</Typography>
                </View>
             </View>
          </View>
        </View>
        <TouchableOpacity className="w-10 h-10 items-center justify-center">
           <MoreVertical size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-6 pt-6" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map((msg, index) => (
            <View 
              key={index} 
              className={cn(
                "mb-6 flex-row",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3 mt-1">
                   <Sparkles size={14} color="#3b82f6" />
                </View>
              )}
              <View className={cn(
                "max-w-[80%] rounded-2xl px-5 py-4 shadow-sm",
                msg.role === "user" 
                  ? "bg-primary rounded-tr-none" 
                  : "bg-card border border-border rounded-tl-none"
              )}>
                <Typography 
                  className={cn(
                    "text-[15px] leading-6",
                    msg.role === "user" ? "text-white" : "text-foreground"
                  )}
                  weight={msg.role === "user" ? "medium" : "normal"}
                >
                  {msg.content}
                </Typography>
              </View>
              {msg.role === "user" && (
                <View className="w-8 h-8 rounded-full bg-slate-700 items-center justify-center ml-3 mt-1">
                   <User size={14} color="white" />
                </View>
              )}
            </View>
          ))}

          {isLoading && (
            <View className="flex-row items-start mb-6">
               <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3 mt-1">
                  <Sparkles size={14} color="#3b82f6" />
               </View>
               <GlassCard intensity={10} className="px-5 py-4 border-0 rounded-2xl rounded-tl-none">
                  <View className="flex-row space-x-1.5 items-center">
                     <ActivityIndicator size="small" color="#3b82f6" />
                     <Typography variant="small" className="text-muted-foreground ml-1">Thinking...</Typography>
                  </View>
               </GlassCard>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View className="px-6 py-6 bg-background border-t border-border/50">
           <View className="flex-row items-center bg-card border border-border h-14 rounded-2xl px-2 shadow-sm">
              <TextInput 
                className="flex-1 px-4 text-foreground text-sm"
                placeholder="Ask your tutor anything..."
                placeholderTextColor="#64748b"
                value={input}
                onChangeText={setInput}
                multiline={false}
              />
              <TouchableOpacity 
                onPress={handleSend}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "w-10 h-10 rounded-xl items-center justify-center",
                  input.trim() && !isLoading ? "bg-primary" : "bg-muted opacity-50"
                )}
              >
                <Send size={18} color="white" />
              </TouchableOpacity>
           </View>
           <View className="mt-3 items-center">
              <Typography variant="small" className="text-[10px] text-muted-foreground opacity-50 font-bold uppercase tracking-widest">
                Powered by Flowversal AI • Sanket
              </Typography>
           </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
