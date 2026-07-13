"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface NavItem {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Exact-match only (don't highlight on child routes). Auto-true for section roots. */
  exact?: boolean;
  badge?: string | number;
  items?: NavSubItem[];
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

const trim = (p: string) => (p.endsWith("/") && p.length > 1 ? p.slice(0, -1) : p);

/** Section roots that must match exactly so they don't stay highlighted on every child route. */
const ROOTS = new Set(["/admin", "/dashboard", "/teacher", "/"]);

function useIsActive() {
  const pathname = usePathname();
  const current = trim(pathname);
  return (url: string, exact?: boolean) => {
    const target = trim(url);
    if (exact || ROOTS.has(target)) return current === target;
    return current === target || current.startsWith(target + "/");
  };
}

/**
 * Renders one or more labeled sidebar sections with unique icons, active-state highlighting,
 * collapsible sub-menus, and icon-rail tooltips. Shared by the student, teacher and admin
 * sidebars so they stay consistent.
 */
export function NavGroups({ groups }: { groups: NavGroup[] }) {
  const isActive = useIsActive();

  return (
    <>
      {groups.map((group, gi) => (
        <SidebarGroup key={group.label ?? `group-${gi}`}>
          {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const hasSub = !!item.items?.length;
                const active =
                  isActive(item.url, item.exact) ||
                  !!item.items?.some((s) => isActive(s.url));

                if (hasSub) {
                  return (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={active}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title} isActive={active}>
                            {item.icon && <item.icon className="size-4" />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items!.map((sub) => (
                              <SidebarMenuSubItem key={sub.title}>
                                <SidebarMenuSubButton asChild isActive={isActive(sub.url)}>
                                  <Link href={sub.url}>
                                    {sub.icon && <sub.icon className="size-4 opacity-70" />}
                                    <span>{sub.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton tooltip={item.title} asChild isActive={active}>
                      <Link href={item.url} className="font-medium">
                        {item.icon && <item.icon className="size-4" />}
                        <span>{item.title}</span>
                        {item.badge != null && (
                          <Badge
                            variant="secondary"
                            className="ml-auto h-5 min-w-5 justify-center px-1 text-[10px] group-data-[collapsible=icon]:hidden"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
