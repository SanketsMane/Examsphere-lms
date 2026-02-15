import { 
  Home, 
  Award, 
  Settings, 
  MessageSquare, 
  Users, 
  Wallet, 
  GraduationCap, 
  Calendar, 
  Video,
  Bot
} from 'lucide-react-native';
import { NavigationCategory } from '../types/navigation';

/**
 * Centralized Drawer Configuration
 * Manage all sidebar links, roles, and categories here.
 * Flattened for a cleaner, one-by-one list view as requested.
 * Sanket
 */
export const DRAWER_CONFIG: NavigationCategory[] = [
  {
    id: 'main',
    title: 'Menu', // Title will be hidden in UI
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: Home,
        route: '/(student)/(drawer)/(tabs)/dashboard',
        roles: ['STUDENT', 'TEACHER', 'ADMIN'],
      },
      {
        id: 'courses',
        title: 'My Courses',
        icon: GraduationCap,
        route: '/(student)/(drawer)/(tabs)/courses',
        roles: ['STUDENT'],
      },
      {
        id: 'sessions',
        title: 'Live Sessions',
        icon: Video,
        route: '/(student)/(drawer)/sessions',
        roles: ['STUDENT', 'TEACHER'],
      },
      {
        id: 'calendar',
        title: 'Calendar',
        icon: Calendar,
        route: '/(student)/(drawer)/calendar',
        roles: ['STUDENT', 'TEACHER'],
      },
      {
        id: 'ai_tutor',
        title: 'AI Tutor',
        icon: Bot,
        route: '/(student)/(drawer)/ai',
        roles: ['STUDENT'],
        badgeCount: 0,
      },
      {
        id: 'mentors',
        title: 'My Mentors',
        icon: MessageSquare,
        route: '/(student)/(drawer)/mentors',
        roles: ['STUDENT'],
      },
      {
        id: 'groups',
        title: 'Study Groups',
        icon: Users,
        route: '/(student)/(drawer)/groups',
        roles: ['STUDENT', 'TEACHER'],
      },
      {
        id: 'certificates',
        title: 'Certificates',
        icon: Award,
        route: '/(student)/(drawer)/certificates',
        roles: ['STUDENT'],
      },
      {
        id: 'wallet',
        title: 'My Wallet',
        icon: Wallet,
        route: '/(student)/(drawer)/wallet',
        roles: ['STUDENT'],
      },
      {
        id: 'settings',
        title: 'Settings',
        icon: Settings,
        route: '/(student)/(drawer)/settings',
        roles: ['STUDENT', 'TEACHER', 'ADMIN'],
      }
    ],
  }
];
