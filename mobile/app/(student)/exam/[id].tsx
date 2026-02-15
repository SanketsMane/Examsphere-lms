import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { examService } from "../../../services/examService";
import { toast } from "sonner-native";

const { width } = Dimensions.get("window");

/**
 * Exam Player Screen
 * Supports MultipleChoice, TrueFalse, ShortAnswer, etc.
 * Sanket
 */
export default function ExamPlayer() {
  const { id: quizId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Quiz Details
  const { data: quizResponse, isLoading, error } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => examService.getQuizDetails(quizId as string),
    enabled: !!quizId,
  });

  const quiz = quizResponse?.data;
  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  // Initialize Timer
  useEffect(() => {
    if (quiz?.timeLimit && timeLeft === null) {
      setTimeLeft(quiz.timeLimit * 60);
    }
  }, [quiz?.timeLimit]); // Only depend on timeLimit, not full quiz object

  // Timer Countdown Logic
  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft]);

  const handleAutoSubmit = () => {
    toast.warning("Time's Up! Submitting your exam...");
    submitMutation.mutate();
  };

  // Answer selection logic
  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleShortAnswer = (questionId: string, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: text
    }));
  };

  // Submission Mutation
  const submitMutation = useMutation({
    mutationFn: () => {
      const formattedResponses = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        answer: ans,
        timeSpent: 0 // Track per-question time if needed
      }));
      return examService.submitAttempt(quizId as string, formattedResponses);
    },
    onSuccess: (res) => {
      if (res.status === "success") {
        toast.success("Exam submitted successfully!");
        router.replace(`/(student)/exam/result/${res.data.id}`);
      } else {
        toast.error(res.message || "Failed to submit exam.");
      }
    }
  });

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ":" : ""}${mins < 10 ? "0" + mins : mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#4D9FFF" />
      </View>
    );
  }

  if (!quiz || error) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <AlertCircle size={48} color="#EF4444" />
        <Text className="text-background-foreground text-lg font-bold mt-4">Exam Unavailable</Text>
        <Text className="text-muted-foreground text-center mt-2">
          This exam might have been removed or is not available yet.
        </Text>
        <TouchableOpacity 
          className="mt-6 bg-primary px-8 py-3 rounded-2xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      
      {/* Navbar with Timer */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border bg-card">
         <TouchableOpacity 
          onPress={() => Alert.alert("Quit Exam?", "Your progress will not be saved.", [
            { text: "Stay", style: "cancel" },
            { text: "Quit", style: "destructive", onPress: () => router.back() }
          ])}
          className="w-10 h-10 bg-muted rounded-xl items-center justify-center"
        >
          <ChevronLeft size={20} color="#94a3b8" />
        </TouchableOpacity>
        
        {timeLeft !== null && (
          <View className={`flex-row items-center px-4 py-2 rounded-full ${timeLeft < 300 ? 'bg-red-500/20' : 'bg-primary/10'}`}>
            <Clock size={16} color={timeLeft < 300 ? "#EF4444" : "#4D9FFF"} />
            <Text className={`ml-2 font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-primary'}`}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        )}
        
        <View className="w-10" />
      </View>

      {/* Progress Bar */}
      <View className="h-1.5 bg-muted w-full">
         <View 
           className="h-full bg-primary" 
           style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} 
         />
      </View>

      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6">
           <Text className="text-primary font-bold">Question {currentQuestionIndex + 1} of {questions.length}</Text>
           <View className="bg-muted px-3 py-1 rounded-full">
              <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">{currentQuestion.points} Points</Text>
           </View>
        </View>

        <Text className="text-background-foreground text-xl font-bold leading-8 mb-8">
           {currentQuestion.question}
        </Text>

        {/* Question Content (Options for MCQs) */}
        <View className="space-y-4">
           {currentQuestion.type === "MultipleChoice" && currentQuestion.questionData?.options?.map((opt: any) => {
             const isSelected = answers[currentQuestion.id] === opt.id;
             return (
               <TouchableOpacity 
                 key={opt.id}
                 activeOpacity={0.7}
                 onPress={() => handleSelectOption(currentQuestion.id, opt.id)}
                 className={`p-5 rounded-3xl border-2 flex-row items-center ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
               >
                 <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-4 ${isSelected ? 'border-primary' : 'border-muted'}`}>
                    {isSelected && <View className="w-3 h-3 rounded-full bg-primary" />}
                 </View>
                 <Text className={`flex-1 text-base ${isSelected ? 'text-primary font-bold' : 'text-background-foreground'}`}>
                   {opt.text}
                 </Text>
               </TouchableOpacity>
             );
           })}

           {/* Add support for other types if needed (TrueFalse, etc.) */}
           {currentQuestion.type === "TrueFalse" && (
             <View className="flex-row space-x-4">
                {["true", "false"].map((val) => {
                   const isSelected = answers[currentQuestion.id] === val;
                   return (
                     <TouchableOpacity 
                       key={val}
                       onPress={() => handleSelectOption(currentQuestion.id, val)}
                       className={`flex-1 p-5 rounded-3xl border-2 items-center justify-center ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                     >
                       <Text className={`capitalize text-lg font-bold ${isSelected ? 'text-primary' : 'text-background-foreground'}`}>
                         {val}
                       </Text>
                     </TouchableOpacity>
                   );
                })}
             </View>
           )}
        </View>
        
        <View className="h-20" />
      </ScrollView>

      {/* Footer Navigation */}
      <View className="p-6 bg-card border-t border-border flex-row items-center justify-between">
        <TouchableOpacity 
          disabled={currentQuestionIndex === 0}
          onPress={() => setCurrentQuestionIndex(prev => prev - 1)}
          className={`flex-row items-center space-x-2 px-6 py-3 rounded-2xl ${currentQuestionIndex === 0 ? 'opacity-30' : ''}`}
        >
          <ChevronLeft size={20} color="#94a3b8" />
          <Text className="text-muted-foreground font-bold">Prev</Text>
        </TouchableOpacity>

        {currentQuestionIndex === questions.length - 1 ? (
          <TouchableOpacity 
            onPress={() => {
              Alert.alert("Submit Exam?", "Are you sure you want to finish your assessment?", [
                { text: "No", style: "cancel" },
                { text: "Confirm Submit", onPress: () => submitMutation.mutate() }
              ]);
            }}
            disabled={submitMutation.isPending}
            className="flex-row items-center bg-emerald-500 px-8 py-4 rounded-2xl shadow-lg shadow-emerald-500/30"
          >
            {submitMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text className="text-white font-bold mr-2 text-lg">Submit</Text>
                <CheckCircle2 size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => setCurrentQuestionIndex(prev => prev + 1)}
            className="flex-row items-center bg-primary px-8 py-4 rounded-2xl shadow-lg shadow-primary/30"
          >
            <Text className="text-white font-bold mr-2 text-lg">Next</Text>
            <ChevronRight size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
