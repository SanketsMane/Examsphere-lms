import React from 'react';
import { View } from 'react-native';
import { Typography } from '../ui/Typography';
import { Flame, Clock, TrendingUp } from 'lucide-react-native';

interface ProgressStatsProps {
  streak?: number;
  hoursLearned?: number;
  completionRate?: number;
}

export const ProgressStats = ({ streak = 0, hoursLearned = 0, completionRate = 0 }: ProgressStatsProps) => {
  return (
    <View className="mb-8">
       <View className="flex-row items-center justify-between mb-4 px-1">
        <Typography variant="h4" weight="bold">Your Progress</Typography>
        {/* Only show 'View History' if there is actual history */}
        {(streak > 0 || hoursLearned > 0) && (
           <Typography variant="small" className="text-indigo-600 dark:text-indigo-400 font-bold">View History</Typography>
        )}
      </View>

      <View className="flex-row gap-3">
        {/* Streak Card */}
        <View className={`flex-1 p-4 rounded-2xl items-start justify-between h-32 ${streak > 0 ? 'bg-orange-500' : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}`}>
            <View className={`p-2 rounded-xl mb-2 ${streak > 0 ? 'bg-white/20' : 'bg-orange-100 dark:bg-orange-500/20'}`}>
               <Flame size={20} color={streak > 0 ? '#fff' : '#f97316'} fill={streak > 0 ? "#fff" : "transparent"} />
            </View>
            <View>
              <Typography variant="h2" className={streak > 0 ? "text-white" : "text-slate-900 dark:text-white"}>
                {streak > 0 ? streak : "Start"}
              </Typography>
              <Typography variant="small" className={`${streak > 0 ? "text-orange-100" : "text-slate-500"} font-medium`}>
                {streak > 0 ? "Day Streak" : "Daily Streak"}
              </Typography>
            </View>
        </View>

        {/* Hours Card */}
        <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 items-start justify-between h-32 shadow-sm">
            <View className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl mb-2">
               <Clock size={20} color="#3b82f6" />
            </View>
            <View>
              <Typography variant="h2" className="text-slate-900 dark:text-white">
                {hoursLearned}h
              </Typography>
              <Typography variant="small" className="text-slate-500 dark:text-slate-400 font-medium">
                 Time
              </Typography>
            </View>
        </View>

        {/* Completion Card */}
        <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 items-start justify-between h-32 shadow-sm">
             <View className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-xl mb-2">
               <TrendingUp size={20} color="#10b981" />
            </View>
            <View>
              <Typography variant="h2" className="text-slate-900 dark:text-white">
                {completionRate}%
              </Typography>
              <Typography variant="small" className="text-slate-500 dark:text-slate-400 font-medium">
                Done
              </Typography>
            </View>
        </View>
      </View>
    </View>
  );
};
