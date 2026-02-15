import { useState, useEffect } from 'react';

export type DashboardSectionId = 
  | 'hero_resume' 
  | 'urgent_actions' 
  | 'progress_stats' 
  | 'quick_actions' 
  | 'recommendations' 
  | 'mentorship';

export interface DashboardSectionConfig {
  id: DashboardSectionId;
  priority: number;
  visible: boolean;
  meta?: any; // Extra data like "title" or ab_test_group
}

// Default High-Retention Layout (The "Golden Path")
const DEFAULT_LAYOUT: DashboardSectionConfig[] = [
  { id: 'hero_resume', priority: 1, visible: true },
  { id: 'urgent_actions', priority: 2, visible: true },
  { id: 'progress_stats', priority: 3, visible: true },
  { id: 'quick_actions', priority: 4, visible: true },
  { id: 'recommendations', priority: 5, visible: true }, // "Continue Learning" list if Hero is generic
  { id: 'mentorship', priority: 6, visible: true },
];

export function useDashboardConfig() {
  const [layout, setLayout] = useState<DashboardSectionConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch for layout config
    const fetchLayout = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Mock network delay
        // In a real app, this would come from an API endpoint like /api/dashboard/layout
        
        // Example: If it's exam season, backend might boost 'urgent_actions' to priority 0
        // const isExamSeason = false;
        // const serverConfig = ... 
        
        setLayout(DEFAULT_LAYOUT.sort((a, b) => a.priority - b.priority));
      } catch (e) {
        console.error("Failed to load dashboard config", e);
        setLayout(DEFAULT_LAYOUT);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLayout();
  }, []);

  return { layout, isLoading };
}
