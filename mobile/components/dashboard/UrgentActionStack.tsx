import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Typography } from '../ui/Typography';
import { Clock, Video, FileText, ArrowRight, Calendar } from 'lucide-react-native';

export interface UrgentItem {
  id: string;
  type: 'live_session' | 'exam' | 'assignment';
  title: string;
  subtitle?: string;
  timestamp: string | Date; // Date object or ISO string
  actionUrl: string;
  isLiveNow?: boolean;
}

interface UrgentActionStackProps {
  items: UrgentItem[];
}

export const UrgentActionStack = ({ items }: UrgentActionStackProps) => {
  if (!items || items.length === 0) return null;

  // Sort by time (nearest first)
  const sortedItems = [...items].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Take top 3 max to avoid clutter
  const topItems = sortedItems.slice(0, 3);

  return (
    <View className="mb-8">
      <View className="flex-row items-center justify-between mb-4 px-1">
        <View className="flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-orange-500 mr-2 animate-pulse" />
          <Typography variant="h4" className="uppercase tracking-widest text-xs text-orange-600 dark:text-orange-400 font-bold">
            Up Next
          </Typography>
        </View>
      </View>

      <View className="space-y-3">
        {topItems.map((item) => {
          const isLive = item.isLiveNow;
          const dateObj = new Date(item.timestamp);
          const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const isToday = new Date().toDateString() === dateObj.toDateString();
          const dateString = isToday ? 'Today' : dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

          return (
            <TouchableOpacity 
              key={item.id}
              activeOpacity={0.7}
              // onPress handled by parent or router logic would be here
              className={`flex-row items-center p-4 rounded-2xl border ${
                isLive 
                  ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-500/30' 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm'
              }`}
            >
              {/* Icon Box */}
              <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
                 isLive ? 'bg-red-100 dark:bg-red-500/20' : 'bg-slate-50 dark:bg-slate-800'
              }`}>
                {item.type === 'live_session' ? (
                  <Video size={20} color={isLive ? '#ef4444' : '#64748b'} />
                ) : item.type === 'exam' ? (
                  <FileText size={20} color="#f59e0b" />
                ) : (
                  <Clock size={20} color="#3b82f6" />
                )}
              </View>

              {/* Text Content */}
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  {isLive && (
                    <View className="px-1.5 py-0.5 bg-red-500 rounded mr-2">
                       <Typography className="text-[9px] font-bold text-white uppercase">LIVE</Typography>
                    </View>
                  )}
                  <Typography weight="bold" className="text-slate-900 dark:text-slate-100" numberOfLines={1}>
                    {item.title}
                  </Typography>
                </View>
                
                <View className="flex-row items-center">
                  <Typography variant="small" className={`mr-1 ${isLive ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
                    {isLive ? 'Happening Now' : `${dateString}, ${timeString}`}
                  </Typography>
                  {!isLive && <Typography variant="small" className="text-slate-300">• {item.subtitle || 'Required'}</Typography>}
                </View>
              </View>

              {/* Action */}
              <View className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 items-center justify-center">
                <ArrowRight size={14} color="#94a3b8" />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
