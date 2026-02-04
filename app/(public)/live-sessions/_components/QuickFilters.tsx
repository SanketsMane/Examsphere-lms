"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, TrendingUp, Clock } from "lucide-react";

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ReactNode;
  filter: any;
}

interface QuickFiltersProps {
  onFilterClick: (filter: any) => void;
  activeFilters?: string[];
}

export function QuickFilters({ onFilterClick, activeFilters = [] }: QuickFiltersProps) {
  // Define quick filter presets (Author: Sanket)
  const quickFilters: QuickFilter[] = [
    {
      id: "free",
      label: "Free Sessions",
      icon: <DollarSign className="h-4 w-4" />,
      filter: { isFree: true },
    },
    {
      id: "this-week",
      label: "This Week",
      icon: <Calendar className="h-4 w-4" />,
      filter: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    },
    {
      id: "morning",
      label: "Morning",
      icon: <Clock className="h-4 w-4" />,
      filter: { timeOfDay: "morning" },
    },
    {
      id: "afternoon",
      label: "Afternoon",
      icon: <Clock className="h-4 w-4" />,
      filter: { timeOfDay: "afternoon" },
    },
    {
      id: "evening",
      label: "Evening",
      icon: <Clock className="h-4 w-4" />,
      filter: { timeOfDay: "evening" },
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-sm font-medium text-muted-foreground flex items-center">
        Quick Filters:
      </span>
      {quickFilters.map((filter) => {
        const isActive = activeFilters.includes(filter.id);
        return (
          <Button
            key={filter.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterClick(filter.filter)}
            className="gap-2"
          >
            {filter.icon}
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}
