import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Typography } from '../ui/Typography';
import { Video, Bot, Award, BookOpen } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export const QuickActionsGrid = () => {
  const router = useRouter();

  const actions = [
    { id: 'live', label: 'Join Live', icon: Video, color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/10', route: '/(student)/(drawer)/sessions' },
    { id: 'ai', label: 'AI Tutor', icon: Bot, color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-900/10', route: '/(student)/(drawer)/sessions' }, // Linked to sessions for now
    { id: 'certs', label: 'My Certs', icon: Award, color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/10', route: '/(student)/(drawer)/certificates' },
    { id: 'courses', label: 'Browse', icon: BookOpen, color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/10', route: '/(student)/(drawer)/(tabs)/courses' },
  ];

  return (
    <View className="mb-8">
      <Typography variant="h4" weight="bold" className="mb-4 px-1">Quick Actions</Typography>
      <View className="flex-row justify-between">
        {actions.map((action) => (
          <TouchableOpacity 
            key={action.id}
            activeOpacity={0.7}
            onPress={() => router.push(action.route as any)}
            className="items-center w-[23%]"
          >
            <View className={`w-16 h-16 rounded-[22px] ${action.bg} items-center justify-center mb-2 shadow-sm border border-slate-100 dark:border-white/5`}>
              <action.icon size={26} color={action.color} strokeWidth={1.5} />
            </View>
            <Typography variant="small" className="text-slate-600 dark:text-slate-400 font-medium text-[11px] text-center">
              {action.label}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
