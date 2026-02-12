"use client";

import { useState, useEffect, useCallback } from "react";
import { SessionFiltersComponent, SessionFilters } from "./SessionFilters";
import { QuickFilters } from "./QuickFilters";
import { SessionGrid } from "./SessionGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Calendar } from "lucide-react";
import { SessionCalendarView } from "@/components/marketing/SessionCalendarView";
import { useDebounce } from "@/hooks/use-debounce";
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket

interface Session {
  id: string;
  title: string;
  description: string | null;
  teacher: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    totalReviews: number;
    isVerified: boolean;
  };
  scheduledAt: string | Date;
  duration: number;
  price: number;
  subject: string | null;
  type: string;
  availableSlots: number;
  maxParticipants?: number;
  confirmedBookings?: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export function LiveSessionsClient() {
  const [userCountry, setUserCountry] = useState<string>("India");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: session } = await authClient.getSession();
      if (session?.user) {
        setUserCountry((session.user as any).country || "India");
      }
    };
    fetchUser();
  }, []);

  // State management (Author: Sanket)
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SessionFilters>({
    search: "",
    subject: "",
    minPrice: "",
    maxPrice: "",
    isFree: false,
    teacherId: "",
    startDate: undefined,
    endDate: undefined,
    timeOfDay: "",
  });
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [view, setView] = useState<"grid" | "calendar">("grid");

  // Debounce search to avoid too many API calls (Author: Sanket)
  const debouncedSearch = useDebounce(filters.search, 500);

  // Fetch sessions from API (Author: Sanket)
  const fetchSessions = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      // Add filters to params
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (filters.subject) params.append("subject", filters.subject);
      if (filters.isFree) {
        params.append("isFree", "true");
      } else {
        if (filters.minPrice) params.append("minPrice", filters.minPrice);
        if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      }
      if (filters.teacherId) params.append("teacherId", filters.teacherId);
      if (filters.startDate) params.append("startDate", filters.startDate.toISOString());
      if (filters.endDate) params.append("endDate", filters.endDate.toISOString());
      if (filters.timeOfDay) params.append("timeOfDay", filters.timeOfDay);

      const response = await fetch(`/api/public/live-sessions?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch sessions");

      const data = await response.json();
      setSessions(data.sessions);
      setPagination(data.pagination);

      // Optionally update filter options from every request
      if (data.options) {
        if (data.options.subjects) setSubjects(data.options.subjects);
        if (data.options.teachers) setTeachers(data.options.teachers);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, pagination.limit]);

  // Fetch subjects and teachers for filters (Author: Sanket)
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const response = await fetch("/api/public/live-sessions");
        if (!response.ok) return;

        const data = await response.json();
        
        if (data.options) {
          if (data.options.subjects) setSubjects(data.options.subjects);
          if (data.options.teachers) setTeachers(data.options.teachers);
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    }

    fetchFilterOptions();
  }, []);

  // Fetch sessions when filters or page changes (Author: Sanket)
  useEffect(() => {
    fetchSessions(pagination.page);
  }, [filters, debouncedSearch]);

  // Handle page change (Author: Sanket)
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    fetchSessions(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle quick filter click (Author: Sanket)
  const handleQuickFilter = (quickFilter: Partial<SessionFilters>) => {
    setFilters((prev) => ({ ...prev, ...quickFilter }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Quick Filters (Author: Sanket) */}
      <div className="mb-6">
        <QuickFilters onFilterClick={handleQuickFilter} />
      </div>

      {/* View Toggle (Author: Sanket) */}
      <div className="flex justify-end mb-6">
        <Tabs value={view} onValueChange={(v) => setView(v as "grid" | "calendar")}>
          <TabsList>
            <TabsTrigger value="grid" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content with Filters (Author: Sanket) */}
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filter Sidebar (Author: Sanket) */}
        <div className="lg:col-span-1">
          <SessionFiltersComponent
            filters={filters}
            onFiltersChange={(newFilters) => {
              setFilters(newFilters);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            subjects={subjects}
            teachers={teachers}
          />
        </div>

        {/* Sessions Display (Author: Sanket) */}
        <div className="lg:col-span-3">
          {view === "grid" ? (
            <SessionGrid
              sessions={sessions}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              userCountry={userCountry}
            />
          ) : (
            <SessionCalendarView sessions={sessions.map(s => ({
              ...s,
              scheduledAt: typeof s.scheduledAt === 'string' ? s.scheduledAt : s.scheduledAt.toISOString(),
              teacher: {
                user: {
                  name: s.teacher.name,
                  image: s.teacher.avatar
                },
                rating: s.teacher.rating,
                totalReviews: s.teacher.totalReviews,
                hourlyRate: 0,
                totalEarnings: 0
              },
              teacherId: s.teacher.id,
              studentId: null
            }))} />
          )}
        </div>
      </div>
    </div>
  );
}
