import React, { useMemo, useCallback } from 'react';
import { View, TouchableOpacity, ScrollView, Alert, Appearance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { LogOut, Sun, Moon } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useRouter, usePathname } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Typography } from '../ui/Typography';
import { ProfileHeader } from './ProfileHeader';
import { DrawerItemLink } from './DrawerItemLink';
import { DRAWER_CONFIG } from '../../utils/drawerConfig';
import { UserRole } from '../../types/navigation';

/**
 * Senior Architect Level Drawer Content
 * Dynamically rendered based on roles and categories.
 * Sanket
 */
export function CustomDrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const toggleTheme = useCallback(() => {
    const newTheme = colorScheme === 'dark' ? 'light' : 'dark';
    console.log(`[Drawer] Toggling theme to: ${newTheme}`);
    Appearance.setColorScheme(newTheme);
  }, [colorScheme]);
  const isDark = colorScheme === 'dark';

  const rawRole = user?.role?.toUpperCase() || 'STUDENT';
  const userRole = (rawRole === 'USER' ? 'STUDENT' : rawRole) as UserRole;
  
  // Diagnostic Log
  console.log(`[Drawer] Raw Role: ${rawRole} -> Effective Role: ${userRole}, Path: ${pathname}`);

  // Optimized filtering logic
  const filteredNavCategories = useMemo(() => {
    const categories = DRAWER_CONFIG.map(category => ({
      ...category,
      items: category.items.filter(item => {
        const hasRole = item.roles.includes(userRole);
        return hasRole;
      })
    })).filter(category => category.items.length > 0);
    
    console.log(`[Drawer] Filtered categories: ${categories.length}`);
    return categories;
  }, [userRole]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to log out of your session?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
          }
        }
      ]
    );
  }, [logout, router]);

  return (
    <View className="flex-1 bg-white dark:bg-[#020817]">
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View className="flex-1">
          {/* Fixed Header */}
          <ProfileHeader user={user} />

          {/* Scrollable Content */}
          <ScrollView 
            className="flex-1"
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {filteredNavCategories.map((category, idx) => (
              <View key={category.id}>
                {/* Items Flat List */}
                {category.items.map(item => (
                  <DrawerItemLink key={item.id} item={item} />
                ))}
              </View>
            ))}

            {/* Theme Toggle - Clean List Style */}
            <TouchableOpacity
              onPress={toggleTheme}
              activeOpacity={0.7}
              className="px-6 py-3 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                   {isDark ? <Moon size={18} color="#3b82f6" /> : <Sun size={18} color="#f59e0b" />}
                </View>
                <Typography weight="medium" className="ml-3 text-slate-700 dark:text-slate-200">
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Typography>
              </View>
              
              <View className={`w-11 h-6 rounded-full p-1 justify-center transition-all ${isDark ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <View className={`w-4 h-4 rounded-full bg-white shadow-sm ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Fixed Footer */}
          <View className="px-6 pb-2 pt-4 border-t border-border/60 bg-background/80">
            <TouchableOpacity 
              onPress={handleLogout}
              activeOpacity={0.8}
              className="flex-row items-center justify-center bg-red-50 dark:bg-red-500/10 py-4 rounded-2xl shadow-sm border border-red-100 dark:border-red-500/20"
            >
              <LogOut size={20} color="#ef4444" strokeWidth={2.5} />
              <Typography weight="bold" className="text-red-500 ml-3 text-base">Sign Out</Typography>
            </TouchableOpacity>
            
            <View className="items-center mt-3 opacity-30 mb-1">
              <Typography className="text-[8px] font-bold tracking-widest uppercase">
                  Kidokool LMS • v1.0.0 (Stable)
              </Typography>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
