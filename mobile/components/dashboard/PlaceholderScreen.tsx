import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, GlassCard, Button } from '../../components/ui';
import { useRouter } from 'expo-router';
import { ChevronLeft, Construction } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

interface PlaceholderProps {
  title: string;
}

export const PlaceholderScreen: React.FC<PlaceholderProps> = ({ title }) => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      <View className="flex-1 px-6 justify-center items-center">
        <GlassCard intensity={20} className="w-full py-12 items-center justify-center border-dashed border-2">
          <View className="w-20 h-20 bg-primary/10 rounded-3xl items-center justify-center mb-6">
            <Construction size={40} color="#3b82f6" />
          </View>
          <Typography variant="h2" className="mb-2">{title}</Typography>
          <Typography variant="p" className="text-center text-muted-foreground px-8 mb-10">
            This feature is currently under active development and will be available in the next production update.
          </Typography>
          <Button 
            label="Back to Dashboard" 
            onPress={() => router.push("/(student)/(drawer)/(tabs)/dashboard")}
            leftIcon={<ChevronLeft size={20} color="white" />}
          />
        </GlassCard>
      </View>
    </SafeAreaView>
  );
};
