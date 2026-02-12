"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, X, Filter, Star } from "lucide-react";
import { getCurrencyConfig } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // To get user country if not passed



const levels = [
  "Beginner",
  "Intermediate",
  "Advanced"
];

// Price ranges are now generated dynamically - Author: Sanket
const ratings = [
  { label: "4.5 & up", value: "4.5" },
  { label: "4.0 & up", value: "4.0" },
  { label: "3.5 & up", value: "3.5" }
];

export function CourseFilters({ categories }: { categories: { id: string; label: string; count: number; parentId?: string | null }[] }) {
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
  const rate = config.exchangeRate;

  const priceRanges = [
    { label: "Free", value: "free" },
    { label: `Under ${s}${Math.round(1000 * rate)}`, value: "under-1000" },
    { label: `${s}${Math.round(1000 * rate)} - ${s}${Math.round(5000 * rate)}`, value: "1000-5000" },
    { label: `${s}${Math.round(5000 * rate)} - ${s}${Math.round(10000 * rate)}`, value: "5000-10000" },
    { label: `${s}${Math.round(10000 * rate)}+`, value: "over-10000" }
  ];
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    categories: searchParams.getAll("category"),
    levels: searchParams.getAll("level"),
    priceRanges: searchParams.getAll("priceRange"),
    minRating: searchParams.get("rating") || "",
  });

  const [localSearch, setLocalSearch] = useState(filters.search);

  // Sync state with URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    filters.categories.forEach(c => params.append("category", c));
    filters.levels.forEach(l => params.append("level", l));
    filters.priceRanges.forEach(p => params.append("priceRange", p));
    if (filters.minRating) params.set("rating", filters.minRating);

    const queryString = params.toString();
    const newUrl = queryString ? `/courses?${queryString}` : "/courses";

    // Use replace to prevent history stack buildup on every click
    router.replace(newUrl, { scroll: false });
  }, [filters, router]);

  const toggleFilter = (type: 'categories' | 'levels' | 'priceRanges', value: string) => {
    setFilters(prev => {
      const current = prev[type];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: localSearch }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      categories: [],
      levels: [],
      priceRanges: [],
      minRating: ""
    });
    setLocalSearch("");
    router.push("/courses");
  };

  const activeFilterCount =
    filters.categories.length +
    filters.levels.length +
    filters.priceRanges.length +
    (filters.minRating ? 1 : 0) +
    (filters.search ? 1 : 0);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-bold flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          Filters
        </h2>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
          >
            Clear All
          </Button>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-200px)] p-4">
        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Search keywords..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 h-10 bg-secondary/30"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>

          <Accordion type="multiple" defaultValue={["categories", "price", "levels", "ratings"]} className="w-full">

            {/* Categories */}
            <AccordionItem value="categories" className="border-b-0">
              <AccordionTrigger className="font-semibold text-sm py-2 hover:no-underline hover:text-primary">
                Categories
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pt-2">
                  {/* Parent Categories */}
                  {categories.filter(c => !c.parentId).map((parent) => (
                    <div key={parent.id} className="space-y-1">
                      <div className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`cat-${parent.id}`}
                          checked={filters.categories.includes(parent.label)}
                          onCheckedChange={() => toggleFilter('categories', parent.label)}
                        />
                        <Label htmlFor={`cat-${parent.id}`} className="text-sm font-semibold cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 flex justify-between">
                          <span>{parent.label}</span>
                          {parent.count > 0 && <span className="text-xs text-muted-foreground">({parent.count})</span>}
                        </Label>
                      </div>
                      
                      {/* Child Categories - Only show if parent is selected */}
                      {filters.categories.includes(parent.label) && categories.filter(c => c.parentId === parent.id).map((child) => (
                        <div key={child.id} className="flex items-center space-x-2 pl-6 py-1 border-l ml-2 border-border/50">
                          <Checkbox
                            id={`cat-${child.id}`}
                            checked={filters.categories.includes(child.label)}
                            onCheckedChange={() => toggleFilter('categories', child.label)}
                          />
                          <Label htmlFor={`cat-${child.id}`} className="text-xs font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 flex justify-between">
                            <span>{child.label}</span>
                            {child.count > 0 && <span className="text-[10px] text-muted-foreground">({child.count})</span>}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ))}
                  
                  {/* Categories without parent (that are not parents themselves) */}
                  {categories.filter(c => c.parentId && !categories.find(p => p.id === c.parentId)).map((orphan) => (
                    <div key={orphan.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`cat-${orphan.id}`}
                        checked={filters.categories.includes(orphan.label)}
                        onCheckedChange={() => toggleFilter('categories', orphan.label)}
                      />
                      <Label htmlFor={`cat-${orphan.id}`} className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 flex justify-between">
                        <span>{orphan.label}</span>
                        {orphan.count > 0 && <span className="text-xs text-muted-foreground">({orphan.count})</span>}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Price */}
            <AccordionItem value="price" className="border-b-0 border-t border-border/50">
              <AccordionTrigger className="font-semibold text-sm py-3 hover:no-underline hover:text-primary">
                Price
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-1">
                  {priceRanges.map((range) => (
                    <div key={range.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`price-${range.value}`}
                        checked={filters.priceRanges.includes(range.value)}
                        onCheckedChange={() => toggleFilter('priceRanges', range.value)}
                      />
                      <Label htmlFor={`price-${range.value}`} className="text-sm font-normal cursor-pointer">
                        {range.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Levels */}
            <AccordionItem value="levels" className="border-b-0 border-t border-border/50">
              <AccordionTrigger className="font-semibold text-sm py-3 hover:no-underline hover:text-primary">
                Level
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-1">
                  {levels.map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lvl-${level}`}
                        checked={filters.levels.includes(level)}
                        onCheckedChange={() => toggleFilter('levels', level)}
                      />
                      <Label htmlFor={`lvl-${level}`} className="text-sm font-normal cursor-pointer">
                        {level}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Ratings */}
            <AccordionItem value="ratings" className="border-b-0 border-t border-border/50">
              <AccordionTrigger className="font-semibold text-sm py-3 hover:no-underline hover:text-primary">
                Ratings
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-1">
                  {ratings.map((rating) => (
                    <div key={rating.value} className="flex items-center space-x-2">
                      <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setFilters(prev => ({ ...prev, minRating: prev.minRating === rating.value ? "" : rating.value }))}>
                        <div className={`w-4 h-4 rounded-full border border-primary flex items-center justify-center ${filters.minRating === rating.value ? 'bg-primary' : ''}`}>
                          {filters.minRating === rating.value && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="flex text-amber-500">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= parseFloat(rating.value) ? 'fill-current' : 'text-slate-200 fill-slate-200'}`} />
                            ))}
                          </div>
                          <span className="text-sm text-foreground group-hover:text-primary">{rating.label}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
}