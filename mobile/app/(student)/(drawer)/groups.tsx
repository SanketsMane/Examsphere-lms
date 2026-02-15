import React from "react";
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { 
  ChevronLeft, 
  Users, 
  MessageCircle, 
  Calendar, 
  Clock, 
  User as UserIcon,
  Search,
  ExternalLink
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { studentService } from "../../../services/studentService";
import { Typography, Card, Badge, GlassCard, Button } from "../../../components/ui";

/**
 * Premium Student Groups & Study Circles Interface
 * Sanket
 */
export default function GroupsScreen() {
  const router = useRouter();

  const { data: groupsResponse, isLoading, refetch } = useQuery({
    queryKey: ["studentGroups"],
    queryFn: () => studentService.getGroups(),
  });

  const groups = groupsResponse?.data || [];

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
        <Typography variant="h4" weight="bold">Study Groups</Typography>
        <TouchableOpacity className="w-12 h-12 bg-card border border-border rounded-2xl items-center justify-center shadow-sm active:scale-95">
          <Search size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3b82f6" />
        }
      >
        <View className="px-6">
          {/* Hero Banner */}
          <GlassCard intensity={20} className="mb-8 py-8 border-0" innerClassName="items-center">
             <View className="w-16 h-16 bg-primary/20 rounded-full items-center justify-center mb-4">
                <Users size={32} color="#3b82f6" />
             </View>
             <Typography variant="h2" weight="bold">{groups.length}</Typography>
             <Typography variant="small" weight="bold" className="text-muted-foreground uppercase tracking-widest mt-1">Active Groups</Typography>
          </GlassCard>

          <Typography variant="h3" className="mb-6">Your Circles</Typography>

          {groups.length > 0 ? (
            groups.map((group: any) => (
              <Card 
                key={group.id}
                className="mb-6 p-0 border-0 shadow-lg shadow-black/5"
                innerClassName="p-0"
              >
                <View className="p-6">
                  <View className="flex-row justify-between items-start mb-5">
                    <View className="flex-1 mr-4">
                      <Typography variant="large" weight="bold" className="mb-1">{group.title}</Typography>
                      <View className="flex-row items-center">
                         <Badge label={group.status} variant={group.status === "Active" ? "success" : "warning"} />
                         <Typography variant="small" className="text-muted-foreground ml-3">Circle #{group.id.slice(0, 5)}</Typography>
                      </View>
                    </View>
                    <TouchableOpacity className="w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center">
                       <MessageCircle size={24} color="#3b82f6" />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row items-center mb-6 space-x-6">
                    <View className="flex-row items-center">
                      <Calendar size={16} color="#94A3B8" />
                      <Typography variant="small" className="ml-2 opacity-70">
                        {new Date(group.scheduledAt).toLocaleDateString()}
                      </Typography>
                    </View>
                    <View className="flex-row items-center">
                      <Clock size={16} color="#94A3B8" />
                      <Typography variant="small" className="ml-2 opacity-70">
                        {group.duration} mins
                      </Typography>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between pt-5 border-t border-border/50">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-full bg-slate-700 items-center justify-center overflow-hidden mr-3">
                        {group.teacher?.image ? (
                          <Image source={{ uri: group.teacher.image }} className="w-full h-full" />
                        ) : (
                          <UserIcon size={14} color="white" />
                        )}
                      </View>
                      <Typography variant="small" weight="bold" className="opacity-80">
                        {group.teacher?.name || "Group Admin"}
                      </Typography>
                    </View>
                    <Button 
                      variant="outline" 
                      className="h-10 px-6 rounded-xl border-primary"
                      textClassName="text-primary"
                      label="View Circle"
                      rightIcon={<ExternalLink size={14} color="#3b82f6" />}
                    />
                  </View>
                </View>
              </Card>
            ))
          ) : !isLoading && (
            <GlassCard intensity={10} className="py-20 items-center justify-center border-dashed border-2 m-1">
              <Users size={56} color="#94A3B8" className="mb-4 opacity-20" />
              <Typography variant="large" weight="bold">No circles joined</Typography>
              <Typography variant="p" className="text-center text-muted-foreground mt-2 px-8">
                Collaborative learning is better! Join a study group or create your own circle to start learning together.
              </Typography>
              <Button 
                variant="primary" 
                className="mt-8 px-8" 
                label="Explore Batches" 
                onPress={() => router.push("/(student)/(drawer)/(tabs)/courses")}
              />
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
