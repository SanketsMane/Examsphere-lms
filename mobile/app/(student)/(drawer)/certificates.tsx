import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  RefreshControl,
  ActivityIndicator,
  Share,
  Platform
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { 
  ChevronRight, 
  Award, 
  Download, 
  Share2, 
  Menu,
  FileCheck
} from "lucide-react-native";
import { useRouter, useNavigation } from "expo-router";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useColorScheme } from "nativewind";
import { studentService } from "../../../services/studentService";
import { Typography, Card, Button, Badge } from "../../../components/ui";
import { toast } from "sonner-native";

/**
 * Premium Certificates Screen
 * Sanket
 */
export default function CertificatesScreen() {
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const { data: certificatesResponse, isLoading, refetch } = useQuery({
    queryKey: ["certificates"],
    queryFn: () => studentService.getCertificates(),
  });

  const certificates = certificatesResponse?.data || [];

  const handleDownload = (cert: any) => {
    toast.success(`Downloading ${cert.title}...`);
    // In a real app, this would trigger file download
  };

  const handleShare = async (cert: any) => {
    try {
      await Share.share({
        message: `Check out my certificate for ${cert.title} on Kidokool!`,
        url: cert.fileUrl // Standard for iOS
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-[#020817]">
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <View style={{ paddingTop: insets.top }} className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6 flex-row items-center justify-between">
           <View className="flex-row items-center">
              <TouchableOpacity 
                onPress={() => navigation.openDrawer()}
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm mr-4"
              >
                <Menu size={20} color={isDark ? "#e2e8f0" : "#334155"} />
              </TouchableOpacity>
              <View>
                <Typography variant="h2" weight="black" className="text-slate-900 dark:text-white leading-tight">
                  Certificates
                </Typography>
                <Typography variant="small" className="text-slate-500 dark:text-slate-400 font-medium">
                  Your achievements unlocked
                </Typography>
              </View>
           </View>
           <View className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/10 items-center justify-center">
              <Award size={20} color={isDark ? "#fbbf24" : "#d97706"} />
           </View>
        </View>

        {/* Content */}
        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={isDark ? "#3b82f6" : "#2563EB"} />
          }
        >
          {certificates.length > 0 ? (
            certificates.map((cert: any) => (
              <Card 
                key={cert.id} 
                className="mb-8 p-0 border border-slate-200 dark:border-slate-800 overflow-hidden rounded-[24px]"
                innerClassName="p-0"
              >
                 {/* Certificate Preview Top */}
                 <View className="h-48 bg-slate-100 dark:bg-slate-800 items-center justify-center relative">
                    {cert.previewUrl ? (
                      <Image source={{ uri: cert.previewUrl }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <View className="items-center opacity-30">
                         <Award size={64} color={isDark ? "#94a3b8" : "#64748b"} />
                         <Typography className="mt-2 font-bold uppercase tracking-widest text-slate-500">Preview</Typography>
                      </View>
                    )}
                    <View className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full">
                       <Typography variant="small" weight="bold" className="text-white text-[10px] uppercase">
                          {cert.issueDate || "Issued Recently"}
                       </Typography>
                    </View>
                 </View>

                 <View className="p-6">
                    <Typography variant="h4" weight="bold" className="text-slate-900 dark:text-white mb-1">
                      {cert.title}
                    </Typography>
                    <Typography className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                      Successfully completed on {cert.completedAt || "Feb 14, 2026"}
                    </Typography>

                    <View className="flex-row gap-3">
                       <TouchableOpacity 
                         onPress={() => handleDownload(cert)}
                         className="flex-1 flex-row items-center justify-center bg-primary h-12 rounded-xl active:opacity-90 shadow-sm"
                       >
                          <Download size={18} color="white" className="mr-2" />
                          <Typography weight="bold" className="text-white">Download</Typography>
                       </TouchableOpacity>
                       
                       <TouchableOpacity 
                         onPress={() => handleShare(cert)}
                         className="w-12 h-12 items-center justify-center border border-slate-200 dark:border-slate-700 rounded-xl active:bg-slate-50 dark:active:bg-slate-800"
                       >
                          <Share2 size={18} color={isDark ? "#e2e8f0" : "#334155"} />
                       </TouchableOpacity>
                    </View>
                 </View>
              </Card>
            ))
          ) : !isLoading && (
            <View className="items-center justify-center py-20">
               <View className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-6">
                  <FileCheck size={40} color={isDark ? "#64748b" : "#94a3b8"} />
               </View>
               <Typography variant="h4" weight="bold" className="text-center text-slate-900 dark:text-white">
                  No certificates yet
               </Typography>
               <Typography className="text-center text-slate-500 dark:text-slate-400 mt-2 leading-6 px-10">
                  Complete courses and pass exams to earn certificates. They will appear here.
               </Typography>
               <Button 
                 label="Browse Courses"
                 onPress={() => router.push("/(student)/(drawer)/(tabs)/courses")}
                 variant="outline"
                 className="mt-8 rounded-full h-12 px-8 border-primary"
                 textClassName="text-primary"
               />
            </View>
          )}

          {isLoading && (
            <View className="mt-20">
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
