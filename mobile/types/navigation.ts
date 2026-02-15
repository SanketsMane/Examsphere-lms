import { LucideIcon } from 'lucide-react-native';

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'USER';

export interface DrawerItem {
  id: string;
  title: string;
  icon: LucideIcon;
  route: string;
  roles: UserRole[];
  badgeCount?: number;
  isExternal?: boolean;
}

export interface NavigationCategory {
  id: string;
  title: string;
  items: DrawerItem[];
  roles?: UserRole[]; // Optional: restrict entire category
}

/**
 * Navigation Architecture Types
 * Sanket
 */
