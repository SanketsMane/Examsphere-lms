import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { 
  Trophy, 
  ChevronRight, 
  Home, 
  BookOpen,
  Frown,
  CheckCircle2,
  XCircle
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import api from "../../../../services/api";

const { width } = Dimensions.get("window");

/**
 * Exam Result Screen
 * Sanket
 */
export default function ExamResult() {
  const { id: attemptId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: attempt, isLoading, error } = useQuery({
    queryKey: ["exam-result", attemptId],
    queryFn: async () => {
      // Direct call since this is a specific attempt lookup
      const res: any = await api.get(`/api/student/exam-attempts/${attemptId}`);
      return res;
    },
    enabled: !!attemptId,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#4D9FFF" />
      </View>
    );
  }

  if (!attempt || error) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-muted-foreground text-center">Result not available.</Text>
        <TouchableOpacity 
          className="mt-4 bg-primary px-6 py-2 rounded-xl"
          onPress={() => router.replace("/(student)/exams")}
        >
          <Text className="text-white font-bold">Go to Exams</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scorePercentage = (attempt.totalPoints / attempt.maxPoints) * 100;
  const isPassed = scorePercentage >= (attempt.passingScore || 40);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      
      <View className="flex-1 px-8 pt-10 items-center">
        {/* Result Icon */}
        <View className={`w-36 h-36 rounded-full items-center justify-center mb-8 border-4 ${isPassed ? 'bg-emerald-500/10 border-emerald-500' : 'bg-red-500/10 border-red-500'}`}>
           {isPassed ? (
             <Trophy size={64} color="#10B981" />
           ) : (
             <Frown size={64} color="#EF4444" />
           )}
        </View>

        <Text className={`text-4xl font-bold mb-2 ${isPassed ? 'text-emerald-500' : 'text-red-500'}`}>
          {isPassed ? "Congratulations!" : "Keep Practicing!"}
        </Text>
        <Text className="text-muted-foreground text-center text-lg mb-10">
          {isPassed 
            ? "You have successfully cleared the assessment." 
            : "You didn't reach the passing score this time."}
        </Text>

        {/* Score Card */}
        <View className="bg-card border border-border w-full p-8 rounded-[40px] items-center shadow-sm">
           <Text className="text-muted-foreground text-sm font-bold uppercase tracking-widest mb-4">Final Score</Text>
           <View className="flex-row items-baseline">
              <Text className="text-6xl font-bold text-background-foreground">{attempt.totalPoints}</Text>
              <Text className="text-2xl text-muted-foreground font-bold ml-2">/ {attempt.maxPoints}</Text>
           </View>
           
           <View className="w-full h-2 bg-muted rounded-full mt-8 overflow-hidden">
              <View 
                className={`h-full ${isPassed ? 'bg-emerald-500' : 'bg-red-500'}`} 
                style={{ width: `${scorePercentage}%` }} 
              />
           </View>
           
           <View className="flex-row justify-between w-full mt-10">
              <View className="items-center">
                 <Text className="text-muted-foreground text-[10px] font-bold uppercase mb-1">Status</Text>
                 <View className={`flex-row items-center px-3 py-1 rounded-full ${isPassed ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {isPassed ? <CheckCircle2 size={12} color="#10B981" /> : <XCircle size={12} color="#EF4444" />}
                    <Text className={`ml-1 text-xs font-bold ${isPassed ? 'text-emerald-500' : 'text-red-500'}`}>
                       {isPassed ? "Passed" : "Failed"}
                    </Text>
                 </View>
              </View>
              <View className="items-center">
                 <Text className="text-muted-foreground text-[10px] font-bold uppercase mb-1">Percentage</Text>
                 <Text className="text-background-foreground text-sm font-bold">{Math.round(scorePercentage)}%</Text>
              </View>
              <View className="items-center">
                 <Text className="text-muted-foreground text-[10px] font-bold uppercase mb-1">Passing</Text>
                 <Text className="text-background-foreground text-sm font-bold">{attempt.passingScore}%</Text>
              </View>
           </View>
        </View>

        <View className="flex-1" />

        {/* Action Buttons */}
        <View className="w-full space-y-4 mb-6">
           <TouchableOpacity 
             onPress={() => router.replace("/(student)/exams")}
             className="bg-primary flex-row items-center justify-center py-4 rounded-3xl shadow-lg shadow-primary/30"
           >
              <BookOpen size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">Back to Exams</Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
             onPress={() => router.replace("/(student)/dashboard")}
             className="bg-muted border border-border flex-row items-center justify-center py-4 rounded-3xl"
           >
              <Home size={20} color="#94a3b8" />
              <Text className="text-muted-foreground font-bold text-lg ml-2">Dashboard</Text>
           </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
