"use client";

import { useState } from "react";
import { SessionCard } from "@/components/ui/session-card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket

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

interface SessionGridProps {
  sessions: Session[];
  pagination: PaginationMeta;
  loading: boolean;
  onPageChange: (page: number) => void;
  userCountry?: string; // Added for localization - Author: Sanket
}

export function SessionGrid({
  sessions,
  pagination,
  loading,
  onPageChange,
  userCountry, // Added for localization - Author: Sanket
}: SessionGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-muted-foreground">No sessions found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results count (Author: Sanket) */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {((pagination.page - 1) * pagination.limit) + 1} -{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} sessions
        </p>
      </div>

      {/* Session Grid (Author: Sanket) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => {
          const start = new Date(session.scheduledAt);
          const end = new Date(start.getTime() + session.duration * 60000);
          const now = new Date();
          
          let status = "Upcoming";
          if (now > end) {
            status = "Expired";
          } else if (now >= start && now <= end) {
            status = "Ongoing";
          } else if (now < start && (start.getTime() - now.getTime()) < 24 * 60 * 60 * 1000) {
             // Optional: Mark as Active if within 24 hours, but user asked for Active->Green
             status = "Upcoming"; // Or "Active" if we want to differentiate
          }

          return (
            <SessionCard
              key={session.id}
              id={session.id}
              title={session.title}
              date={start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              time={start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
              duration={`${session.duration} min`}
              price={formatPriceSimple(session.price / 100, userCountry)}
              instructor={session.teacher.name}
              level={status}
              rating={session.teacher.rating}
              index={0}
              participants={session.confirmedBookings || 0}
              maxParticipants={session.maxParticipants || 1}
            />
          );
        })}
      </div>

      {/* Pagination Controls (Author: Sanket) */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  disabled={loading}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasMore || loading}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
