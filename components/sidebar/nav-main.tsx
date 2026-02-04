"use client";

import { ChevronRight, type Icon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
    icon?: any;
    items?: {
      title: string;
      url: string;
      icon?: any;
    }[];
  }[];
}) {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">

        <SidebarMenu>
          {items.map((item) => {
            const hasSubItems = item.items && item.items.length > 0;
            
            // Normalizing paths
            const normalizedPath = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
            const normalizedItemUrl = item.url.endsWith("/") && item.url.length > 1 ? item.url.slice(0, -1) : item.url;
            
            // Check if active (either current page matches or is a child path)
            // Check if active (either current page matches, is a child path, or any sub-item is active)
            const isSubItemActive = item.items?.some(subItem => {
               const normalizedSubUrl = subItem.url.endsWith("/") && subItem.url.length > 1 ? subItem.url.slice(0, -1) : subItem.url;
               return normalizedPath === normalizedSubUrl || normalizedPath.startsWith(normalizedSubUrl);
            });

            const isActive = isSubItemActive || (["/admin", "/dashboard", "/teacher"].includes(normalizedItemUrl)
              ? normalizedPath === normalizedItemUrl
              : normalizedPath.startsWith(normalizedItemUrl));

            return (
              <SidebarMenuItem key={item.title}>
                {hasSubItems ? (
                  <Collapsible defaultOpen={isActive} className="group/collapsible">
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const normalizedSubUrl = subItem.url.endsWith("/") && subItem.url.length > 1 ? subItem.url.slice(0, -1) : subItem.url;
                          const isSubActive = normalizedPath === normalizedSubUrl;
                          
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isSubActive}>
                                <Link href={subItem.url}>
                                  {subItem.icon && <subItem.icon className="size-4 opacity-70" />}
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <SidebarMenuButton tooltip={item.title} asChild isActive={isActive}>
                    <Link
                      href={item.url}
                      className="font-medium"
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup >
  );
}
