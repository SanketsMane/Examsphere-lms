"use client";

import { type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">

        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {(() => {
                const isActive = ["/admin", "/dashboard", "/teacher"].includes(item.url)
                  ? pathname === item.url
                  : pathname.startsWith(item.url);
                return (
                  <SidebarMenuButton tooltip={item.title} asChild>
                    <Link
                      href={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors hover:bg-muted dark:hover:bg-white/5",
                        isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                      )}
                    >
                      {item.icon && (
                        <item.icon
                          className={cn("h-4 w-4", isActive && "text-white")}
                        />
                      )}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                );
              })()}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup >
  );
}
