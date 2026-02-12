"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, X, Calendar as CalendarIcon, DollarSign, BookOpen, Clock, Filter } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getCurrencyConfig } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket

// Filter state interface (Author: Sanket)
export interface SessionFilters {
  search: string;
  subject: string;
  minPrice: string;
  maxPrice: string;
  isFree: boolean;
  teacherId: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  timeOfDay: string;
}

interface SessionFiltersProps {
  filters: SessionFilters;
  onFiltersChange: (filters: SessionFilters) => void;
  subjects: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
}

export function SessionFiltersComponent({
  filters,
  onFiltersChange,
  subjects,
  teachers,
}: SessionFiltersProps) {
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

  const config = getCurrencyConfig(userCountry);
  const s = config.symbol;

  const [isOpen, setIsOpen] = useState(true);

  // Update filters helper (Author: Sanket)
  const updateFilter = (key: keyof SessionFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Clear all filters (Author: Sanket)
  const clearFilters = () => {
    onFiltersChange({
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
  };

  // Count active filters (Author: Sanket)
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return false; // Don't count search
    if (typeof value === 'boolean') return value;
    return value !== "" && value !== undefined;
  }).length;

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {activeFilterCount > 0 && (
              <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                {activeFilterCount}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-8 w-8 p-0"
          >
            {isOpen ? "−" : "+"}
          </Button>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-6">
          {/* Search (Author: Sanket) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Label>
            <div className="relative">
              <Input
                placeholder="Search sessions, teachers..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pr-8"
              />
              {filters.search && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-2"
                  onClick={() => updateFilter("search", "")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

            {/* Subject Filter (Author: Sanket) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subject
            </Label>
            <Select
              value={filters.subject || "ALL"}
              onValueChange={(value) => updateFilter("subject", value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Filter (Author: Sanket) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price ({config.code})
            </Label>
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                id="free"
                checked={filters.isFree}
                onCheckedChange={(checked) => {
                  updateFilter("isFree", checked);
                  if (checked) {
                    updateFilter("minPrice", "");
                    updateFilter("maxPrice", "");
                  }
                }}
              />
              <label
                htmlFor="free"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Free sessions only
              </label>
            </div>
            {!filters.isFree && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter("minPrice", e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter("maxPrice", e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Time of Day Filter (Author: Sanket) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time of Day
            </Label>
            <Select
              value={filters.timeOfDay || "ALL"}
              onValueChange={(value) => updateFilter("timeOfDay", value === "ALL" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Any time</SelectItem>
                <SelectItem value="morning">Morning (6 AM - 12 PM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12 PM - 6 PM)</SelectItem>
                <SelectItem value="evening">Evening (6 PM - 12 AM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter (Author: Sanket) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Date Range
            </Label>
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !filters.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(filters.startDate, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => updateFilter("startDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !filters.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(filters.endDate, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => updateFilter("endDate", date)}
                    initialFocus
                    disabled={(date) =>
                      filters.startDate ? date < filters.startDate : false
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Teacher Filter (Author: Sanket) */}
          {teachers.length > 0 && (
            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select
                value={filters.teacherId || "ALL"}
                onValueChange={(value) => updateFilter("teacherId", value === "ALL" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All teachers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All teachers</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Clear Filters Button (Author: Sanket) */}
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={clearFilters}
            >
              <X className="mr-2 h-4 w-4" />
              Clear all filters
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
