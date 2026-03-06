"use client";

import { Marquee } from "@/components/ui/marquee";
import { Sparkles, Tag, Zap, Gift, Megaphone } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
// import { Broadcast, BroadcastType } from "@prisma/client"; // Avoiding lint error

// Local type definitions to match Prisma schema
type BroadcastType = "Info" | "Offer" | "Alert" | "Coupon";

interface Broadcast {
  id: string;
  text: string;
  type: BroadcastType;
  link: string | null;
  buttonText: string | null;
  couponCode: string | null;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

interface BroadcastBannerProps {
  broadcasts?: Broadcast[];
  className?: string;
}

export function BroadcastBanner({ broadcasts = [], className }: BroadcastBannerProps) {
  if (!broadcasts || broadcasts.length === 0) return null;

  const getIcon = (type: BroadcastType) => {
    switch (type) {
      case "Offer": return Tag;
      case "Coupon": return Sparkles;
      case "Alert": return Zap;
      default: return Megaphone;
    }
  };

  const getColor = (type: BroadcastType) => {
    switch (type) {
      case "Offer": return "text-yellow-200";
      case "Coupon": return "text-purple-200";
      case "Alert": return "text-red-200";
      default: return "text-cyan-200";
    }
  };

  return (
    <div className={cn("relative z-50 overflow-hidden bg-gradient-to-r from-indigo-900 via-violet-900 to-indigo-900 border-b border-indigo-500/30 text-white shadow-xl isolate", className)}>
        {/* Abstract Background Elements */}
        {/* Removed missing noise.png texture to fix 404 error */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000"></div>

      <Marquee pauseOnHover repeat={10} className="[--duration:20s] py-2.5">
        {broadcasts.map((item, i) => {
          const Icon = getIcon(item.type);
          const color = getColor(item.type);
          
          return (
            <div key={item.id} className="flex items-center gap-3 mx-8 select-none">
              <Icon className={cn("w-4 h-4", color)} />
              <span className="text-sm font-medium tracking-wide text-indigo-50/90">
                {item.text}
              </span>
              {item.couponCode && (
                <span className="text-xs font-black bg-white/10 border border-white/20 text-yellow-300 px-2 py-0.5 rounded uppercase tracking-wider shadow-sm backdrop-blur-md hover:bg-white/20 transition-colors cursor-pointer">
                  {item.couponCode}
                </span>
              )}
              {item.link && item.buttonText && (
                <Link
                  href={item.link}
                  className="text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white px-2.5 py-0.5 rounded shadow-sm transition-colors flex items-center gap-1"
                >
                  {item.buttonText}
                </Link>
              )}
              <div className={`w-1 h-1 rounded-full bg-indigo-500/50 ml-4`} />
            </div>
          );
        })}
      </Marquee>
    </div>
  );
}
