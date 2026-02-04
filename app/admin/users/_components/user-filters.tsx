"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconSearch } from "@tabler/icons-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/use-debounce";

export function UserFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentRole = searchParams.get("role") || "all";
  const currentSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(currentSearch);
  const debouncedSearch = useDebounce(search, 500);

  const updateFilters = (role: string, query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (role && role !== "all") {
      params.set("role", role);
    } else {
      params.delete("role");
    }

    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  useEffect(() => {
    if (debouncedSearch !== currentSearch) {
      updateFilters(currentRole, debouncedSearch);
    }
  }, [debouncedSearch]);

  const onRoleChange = (role: string) => {
    updateFilters(role, search);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <Tabs value={currentRole} onValueChange={onRoleChange}>
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="teacher">Teachers</TabsTrigger>
            <TabsTrigger value="student">Students</TabsTrigger>
            <TabsTrigger value="admin">Admins</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="relative w-full md:w-72">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search name or email..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {isPending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        )}
      </div>
    </div>
  );
}
