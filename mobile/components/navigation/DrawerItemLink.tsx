import React, { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Typography } from '../ui/Typography';
import { DrawerItem as DrawerItemType } from '../../types/navigation';
import { useRouter, usePathname } from 'expo-router';

interface DrawerItemLinkProps {
  item: DrawerItemType;
  onPress?: () => void;
}

/**
 * Enhanced Drawer Item with Active State & Badges
 * Optimized with memo to prevent redundant re-renders.
 * Sanket
 */
export const DrawerItemLink: React.FC<DrawerItemLinkProps> = memo(({ item, onPress }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === item.route;
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(item.route as any);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.6}
      accessible={true}
      accessibilityLabel={item.title}
      accessibilityRole="button"
      className={
        "flex-row items-center justify-between px-5 py-3.5 rounded-2xl mb-1 mx-4 " +
        (isActive ? "bg-primary/10" : "active:bg-muted/50")
      }
    >
      <View className="flex-row items-center flex-1">
        <View className={
          "w-10 h-10 rounded-xl items-center justify-center mr-4 " +
          (isActive ? "bg-primary shadow-lg shadow-primary/20" : "bg-muted/30")
        }>
          <item.icon 
            size={20} 
            color={isActive ? '#ffffff' : '#64748B'} 
            strokeWidth={isActive ? 2.5 : 2}
          />
        </View>
        <Typography 
          weight={isActive ? "bold" : "semibold"}
          className={isActive ? 'text-primary' : 'text-slate-800 dark:text-slate-200'}
        >
          {item.title}
        </Typography>
      </View>

      {item.badgeCount !== undefined && item.badgeCount > 0 && (
        <View className="bg-primary px-2 py-0.5 rounded-full">
          <Typography className="text-[10px] text-white font-bold">
            {item.badgeCount > 99 ? '99+' : item.badgeCount}
          </Typography>
        </View>
      )}

      {isActive && (
        <View className="absolute left-0 w-1.5 h-6 bg-primary rounded-r-full" />
      )}
    </TouchableOpacity>
  );
});
