import { View, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { Moon, User, Bell, LogOut, ChevronRight, Sun, Shield, Info } from 'lucide-react-native';
import { useAuthStore } from '../../../stores/authStore';
import { Typography, Card, Button, GlassCard } from '../../../components/ui';
import { cn } from '../../../utils/cn';

/**
 * Premium App Settings Screen
 * Sanket
 */
export default function SettingsScreen() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const router = useRouter();
  const logout = useAuthStore((state: any) => state.logout);

  const isDark = colorScheme === 'dark';

  const settingSections = [
    {
      title: "Appearance",
      items: [
        { 
          icon: isDark ? <Moon size={18} color="#3b82f6" /> : <Sun size={18} color="#f59e0b" />, 
          label: "Dark Mode", 
          type: "switch",
          value: isDark,
          onValueChange: toggleColorScheme
        },
      ]
    },
    {
      title: "Account & Security",
      items: [
        { icon: <User size={18} color="#3b82f6" />, label: "Profile Settings", route: "/(student)/settings/personal-info" },
        { icon: <Bell size={18} color="#3b82f6" />, label: "Notification Preferences", route: "/(student)/settings/notifications" },
        { icon: <Shield size={18} color="#3b82f6" />, label: "Privacy & Data", route: "/(student)/settings/security" },
      ]
    },
    {
      title: "About",
      items: [
        { icon: <Info size={18} color="#3b82f6" />, label: "Help Center", route: "/(student)/(drawer)/settings" },
        { icon: <Info size={18} color="#3b82f6" />, label: "Terms of Service", route: "/(student)/(drawer)/settings" },
      ]
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-4 mb-8">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-12 h-12 bg-card border border-border rounded-2xl items-center justify-center shadow-sm active:scale-95"
        >
          <ChevronRight size={20} color="#94a3b8" className="rotate-180" />
        </TouchableOpacity>
        <Typography variant="h4" weight="bold">Settings</Typography>
        <View className="w-12" />
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {settingSections.map((section, sIndex) => (
          <View key={sIndex} className="mb-8">
            <Typography variant="small" weight="bold" className="text-muted-foreground uppercase tracking-widest ml-4 mb-4">
              {section.title}
            </Typography>
            <Card className="p-0 shadow-lg shadow-black/5 overflow-hidden" innerClassName="p-0">
              {section.items.map((item: any, iIndex) => (
                <View 
                  key={iIndex}
                  className={cn(
                    "flex-row items-center p-5",
                    iIndex !== section.items.length - 1 ? "border-b border-border/50" : ""
                  )}
                >
                  <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center mr-4">
                    {item.icon}
                  </View>
                  <Typography weight="semibold" className="flex-1">{item.label}</Typography>
                  
                  {item.type === "switch" ? (
                    <Switch 
                      value={item.value} 
                      onValueChange={item.onValueChange}
                      trackColor={{ false: '#e4e4e7', true: '#3b82f6' }}
                      thumbColor={'#ffffff'}
                    />
                  ) : (
                    <TouchableOpacity 
                       onPress={() => item.route && router.push(item.route as any)}
                       hitSlop={20}
                    >
                       <ChevronRight size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </Card>
          </View>
        ))}

        <Button 
          variant="destructive"
          className="mt-4 h-14 rounded-2xl bg-red-500/10 border border-red-500/20"
          textClassName="text-red-500 font-bold"
          label="Sign Out"
          leftIcon={<LogOut size={20} color="#ef4444" />}
          onPress={logout}
        />
        
        <View className="items-center mt-12">
           <GlassCard intensity={10} className="px-6 py-2 border-0 rounded-full" innerClassName="p-0">
              <Typography variant="small" className="opacity-40">Version 1.0.0 (Production Build)</Typography>
           </GlassCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { StatusBar } from 'expo-status-bar';

