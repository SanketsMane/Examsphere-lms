import React from "react";
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Image,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { 
  ChevronLeft, 
  Play, 
  Calendar, 
  Clock, 
  User as UserIcon,
  Search,
  Video
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSessions } from "../../../hooks/useSessions";
import { Typography, Card, Badge, GlassCard, Button } from "../../../components/ui";

/**
 * Premium Student Live Sessions Hub
 * Sanket
 */
export default function SessionsScreen() {
  const router = useRouter();
  const { sessions, sessionsLoading: isLoading, refetchSessions } = useSessions();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-4 mb-6">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-12 h-12 bg-card border border-border rounded-2xl items-center justify-center shadow-sm active:scale-95"
        >
          <ChevronLeft size={20} color="#94a3b8" />
        </TouchableOpacity>
        <Typography variant="h4" weight="bold">Live Sessions</Typography>
        <TouchableOpacity className="w-12 h-12 bg-card border border-border rounded-2xl items-center justify-center shadow-sm active:scale-95">
          <Search size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetchSessions} tintColor="#3b82f6" />
        }
      >
        <View className="px-6">
          {/* Hero Stats */}
          <View className="flex-row mb-8 space-x-4">
            <GlassCard intensity={15} className="flex-1 items-center py-6 border-0" innerClassName="items-center">
              <Typography variant="h3" weight="bold" className="text-primary">{sessions.length}</Typography>
              <Typography variant="small" weight="bold" className="text-muted-foreground uppercase text-[8px] tracking-widest mt-1">Upcoming</Typography>
            </GlassCard>
            <GlassCard intensity={15} className="flex-1 items-center py-6 border-0" innerClassName="items-center">
              <Typography variant="h3" weight="bold" className="text-emerald-500">24h</Typography>
              <Typography variant="small" weight="bold" className="text-muted-foreground uppercase text-[8px] tracking-widest mt-1">Next Session</Typography>
            </GlassCard>
          </View>

          <Typography variant="h3" className="mb-6">Schedule Overview</Typography>

          {sessions.length > 0 ? (
            sessions.map((session: any) => (
              <Card 
                key={session.id}
                className="mb-6 p-0 border-0 shadow-lg shadow-black/5"
                innerClassName="p-0"
                onPress={() => {}}
              >
                <View className="p-6">
                  <View className="flex-row justify-between items-start mb-5">
                    <View className="flex-1 mr-4">
                      <Typography variant="large" weight="bold" className="mb-1">{session.title}</Typography>
                      <View className="flex-row items-center">
                         <Badge label={session.subject || "Academic"} variant="secondary" />
                         {new Date(session.scheduledAt).toDateString() === new Date().toDateString() && (
                            <View className="ml-3 px-2 py-0.5 bg-red-500/10 rounded-md">
                               <Typography variant="small" weight="bold" className="text-red-500 text-[10px]">TODAY</Typography>
                            </View>
                         )}
                      </View>
                    </View>
                    <View className="w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center">
                      <Video size={24} color="#3b82f6" />
                    </View>
                  </View>

                  <View className="flex-row items-center mb-6 space-x-6">
                    <View className="flex-row items-center">
                      <Calendar size={16} color="#94A3B8" />
                      <Typography variant="small" className="ml-2 opacity-70">
                        {new Date(session.scheduledAt).toLocaleDateString()}
                      </Typography>
                    </View>
                    <View className="flex-row items-center">
                      <Clock size={16} color="#94A3B8" />
                      <Typography variant="small" className="ml-2 opacity-70">
                        {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between pt-5 border-t border-border/50">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-full bg-slate-700 items-center justify-center overflow-hidden mr-3">
                        {session.teacher?.user?.image ? (
                          <Image source={{ uri: session.teacher.user.image }} className="w-full h-full" />
                        ) : (
                          <UserIcon size={14} color="white" />
                        )}
                      </View>
                      <Typography variant="small" weight="bold" className="opacity-80">
                        {session.teacher?.user?.name || "Expert Instructor"}
                      </Typography>
                    </View>
                    <Button 
                      variant="primary" 
                      className="h-10 px-6 rounded-xl"
                      label="Join Meeting"
                      leftIcon={<Play size={16} color="white" fill="white" />}
                    />
                  </View>
                </View>
              </Card>
            ))
          ) : !isLoading && (
            <GlassCard intensity={10} className="py-20 items-center justify-center border-dashed border-2 m-1">
              <Video size={56} color="#94A3B8" className="mb-4 opacity-20" />
              <Typography variant="large" weight="bold">No scheduled sessions</Typography>
              <Typography variant="p" className="text-center text-muted-foreground mt-2 px-8">
                You don't have any upcoming live classes. Book a session or wait for your instructor to schedule one.
              </Typography>
            </GlassCard>
          )}

          {isLoading && (
            <View className="py-20">
               <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
