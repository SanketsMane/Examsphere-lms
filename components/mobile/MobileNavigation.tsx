"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Menu,
  X,
  Home,
  BookOpen,
  Video,
  Users,
  BarChart3,
  MessageSquare,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown
} from "lucide-react";
import Logo from "@/public/logo.png";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { MessageNotification } from "@/components/messaging/MessageNotification";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "Live Sessions", href: "/live-sessions", icon: Video },
  { name: "Blog", href: "/blog", icon: BookOpen },
  { name: "Instructors", href: "/marketplace", icon: Users },
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
];

export function MobileNavbar() {
  const { data: session, isPending } = authClient.useSession();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 shadow-sm lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            EXAMSPHERE
          </span>
        </Link>

        {/* Right side - User actions & Menu */}
        <div className="flex items-center gap-2">
          {session && (
            <>
              <NotificationBell />
              <MessageNotification />
            </>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">K</span>
                  </div>
                  EXAMSPHERE
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* User Profile Section */}
                {session ? (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session.user.image || ""} />
                      <AvatarFallback>
                        {session.user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/sign-in">
                      <Button className="w-full" onClick={() => setIsOpen(false)}>
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
                        Register
                      </Button>
                    </Link>
                  </div>
                )}

                <Separator />

                {/* Navigation Items */}
                <nav className="space-y-1">
                  {navigationItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <IconComponent className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                {session && (
                  <>
                    <Separator />

                    {/* Dashboard Quick Links */}
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground px-3">Quick Access</h4>
                      <Link
                        href="/dashboard/messages"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Messages</span>
                      </Link>
                      <Link
                        href="/dashboard/notifications"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Bell className="h-4 w-4" />
                        <span>Notifications</span>
                      </Link>
                      <Link
                        href="/dashboard/analytics"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics</span>
                      </Link>
                    </div>

                    <Separator />

                    {/* User Actions */}
                    <div className="space-y-1">
                      <Link
                        href={session.user.role === "teacher" ? "/teacher/profile" : "/dashboard/settings"}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </div>
                  </>
                )}

                <Separator />

                {/* Theme Toggle */}
                <div className="flex items-center justify-between px-3">
                  <span className="text-sm">Dark Mode</span>
                  <ThemeToggle />
                </div>

                {session && (
                  <>
                    <Separator />
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={async () => {
                        await authClient.signOut();
                        setIsOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

// Bottom Navigation for Mobile
export function MobileBottomNavigation() {
  const { data: session } = authClient.useSession();

  if (!session) return null;

  const bottomNavItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Courses", href: "/courses", icon: BookOpen },
    { name: "Sessions", href: "/dashboard/sessions", icon: Video },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    {
      name: "Profile",
      href: session.user.role === "teacher" ? "/teacher/profile" : "/dashboard/settings",
      icon: User
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {bottomNavItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center py-2 px-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <IconComponent className="h-5 w-5 mb-1" />
              <span className="text-xs truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}