"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Video, DollarSign, Users, Star, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/currency";

/**
 * Author: Sanket
 */

interface Stats {
  total: number;
  upcoming: number;
  completed: number;
  totalEarnings: number;
  averageRating?: number;
  totalStudents?: number;
  growth?: {
    earnings: number;
    sessions: number;
  };
}

export function SessionStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/teacher/sessions?limit=1');
      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Multi-currency support
  const formatCurrency = (amountInBaseUnits: number) => {
    return formatPrice(amountInBaseUnits);
  };

  const statsCards = [
    {
      title: "Upcoming Sessions",
      value: stats?.upcoming || 0,
      icon: Video,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-950",
      change: stats?.growth?.sessions || 0
    },
    {
      title: "Total Earnings",
      value: formatCurrency(stats?.totalEarnings || 0),
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-950",
      change: stats?.growth?.earnings || 0
    },
    {
      title: "Completed Sessions",
      value: stats?.completed || 0,
      icon: Users,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-950"
    },
    {
      title: "Average Rating",
      value: stats?.averageRating ? `${stats.averageRating.toFixed(1)} ⭐` : "N/A",
      icon: Star,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-950"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statsCards.map((stat, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {stat.title}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                  {stat.change !== undefined && stat.change !== 0 && (
                    <span className={`text-xs font-medium flex items-center gap-1 ${stat.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {stat.change > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(stat.change)}%
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
